package handlers

import (
	"context"
	"math"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type CheckoutRequest struct {
	UserID      string   `json:"user_id"`
	CampaignIDs []string `json:"campaign_ids"`
	PointUsed   int      `json:"point_used"`
}

type CheckoutResponse struct {
	TotalPrice float64 `json:"total_price"`
	Message    string  `json:"message"`
}

// Checkout godoc
// @Summary Checkout cart items
// @Description Calculate total price, apply campaigns, and store transaction history
// @Tags Checkout
// @Accept json
// @Produce json
// @Param checkout body CheckoutRequest true "Checkout payload"
// @Success 200 {object} CheckoutResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /checkout [post]
func Checkout(c *fiber.Ctx) error {
	var req CheckoutRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request body"})
	}

	if req.UserID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "user_id is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Fetch cart items
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"user_id": req.UserID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "Products",
			"localField":   "product_id",
			"foreignField": "_id",
			"as":           "product",
		}}},
		{{Key: "$unwind", Value: "$product"}},
	}

	cursor, err := db.CartCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to fetch cart items"})
	}
	defer cursor.Close(ctx)

	var cartItems []struct {
		ProductID string         `bson:"product_id"`
		Quantity  int            `bson:"quantity"`
		Product   models.Product `bson:"product"`
	}
	if err = cursor.All(ctx, &cartItems); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to decode cart items"})
	}

	if len(cartItems) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Cart is empty"})
	}

	// Fetch User to check points
	var user models.User
	if err := db.UserCollection.FindOne(ctx, bson.M{"_id": req.UserID}).Decode(&user); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "User not found"})
	}

	if req.PointUsed > user.Point {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Insufficient points"})
	}

	// 2. Calculate subtotal
	var subtotal float64
	for _, item := range cartItems {
		subtotal += item.Product.Price * float64(item.Quantity)
	}

	// 3. Apply campaigns
	totalPrice := subtotal
	if len(req.CampaignIDs) > 0 {
		// Fetch selected campaigns
		var campaigns []models.Campaign
		campaignFilter := bson.M{
			"_id":       bson.M{"$in": req.CampaignIDs},
			"is_active": true,
		}
		campaignCursor, err := db.CampaignCollection.Find(ctx, campaignFilter)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to fetch campaigns"})
		}
		defer campaignCursor.Close(ctx)
		if err = campaignCursor.All(ctx, &campaigns); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to decode campaigns"})
		}

		for _, campaign := range campaigns {
			switch campaign.DiscountType {
			case "percent":
				discount := subtotal * (campaign.DiscountValue / 100)
				totalPrice -= discount
			case "fixed":
				totalPrice -= campaign.DiscountValue
			case "spendAndSave":
				// Example: Spend 100 save 10
				if campaign.Every > 0 && campaign.DiscountValue > 0 {
					times := math.Floor(subtotal / campaign.Every)
					discount := times * campaign.DiscountValue
					if campaign.Limit > 0 && discount > campaign.Limit {
						discount = campaign.Limit
					}
					totalPrice -= discount
				}
			}
		}
	}

	// Apply Point Discount
	if req.PointUsed > 0 {
		totalPrice -= float64(req.PointUsed)
	}

	if totalPrice < 0 {
		totalPrice = 0
	}

	// Deduct points from user
	if req.PointUsed > 0 {
		update := bson.M{"$inc": bson.M{"point": -req.PointUsed}}
		if _, err := db.UserCollection.UpdateOne(ctx, bson.M{"_id": req.UserID}, update); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to update user points"})
		}
	}

	// 4. Create History
	historyID := uuid.New().String()
	history := models.TransactionHistory{
		ID:        historyID,
		UserID:    req.UserID,
		PointUsed: req.PointUsed,
		Date:      time.Now(),
	}
	if _, err := db.TransactionHistoryCollection.InsertOne(ctx, history); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create history"})
	}

	// 5. Create HistoryProduct
	var historyProducts []interface{}
	for _, item := range cartItems {
		historyProducts = append(historyProducts, models.TransactionHistoryProduct{
			HistoryID: historyID,
			ProductID: item.ProductID,
		})
	}
	if len(historyProducts) > 0 {
		if _, err := db.TransactionHistoryProductCollection.InsertMany(ctx, historyProducts); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create history products"})
		}
	}

	// 6. Create HistoryCampaign
	if len(req.CampaignIDs) > 0 {
		var historyCampaigns []interface{}
		for _, campaignID := range req.CampaignIDs {
			historyCampaigns = append(historyCampaigns, models.TransactionHistoryCampaign{
				HistoryID:  historyID,
				CampaignID: campaignID,
			})
		}
		if _, err := db.TransactionHistoryCampaignCollection.InsertMany(ctx, historyCampaigns); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create history campaigns"})
		}
	}

	// 7. Clear cart
	if _, err := db.CartCollection.DeleteMany(ctx, bson.M{"user_id": req.UserID}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to clear cart"})
	}

	return c.JSON(CheckoutResponse{
		TotalPrice: totalPrice,
		Message:    "Checkout successful",
	})
}
