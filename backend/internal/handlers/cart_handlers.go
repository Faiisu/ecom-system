package handlers

import (
	"context"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type AddCartItemRequest struct {
	UserID    string `json:"user_id"`
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

// AddCartItem godoc
// @Summary Add item to cart
// @Description Adds a product to the user's cart or updates quantity if it already exists
// @Tags Cart
// @Accept json
// @Produce json
// @Param cartItem body AddCartItemRequest true "Cart Item payload"
// @Success 200 {object} models.CartItem
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cart [post]
func AddCartItem(c *fiber.Ctx) error {
	var req AddCartItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request body"})
	}

	if req.UserID == "" || req.ProductID == "" || req.Quantity <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid input: user_id, product_id, and quantity > 0 are required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if item exists in cart
	filter := bson.M{
		"user_id":    req.UserID,
		"product_id": req.ProductID,
	}

	var existingItem models.CartItem
	err := db.CartCollection.FindOne(ctx, filter).Decode(&existingItem)

	if err == nil {
		// Item exists, update quantity
		update := bson.M{
			"$inc": bson.M{"quantity": req.Quantity},
		}
		_, err := db.CartCollection.UpdateOne(ctx, filter, update)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to update cart item"})
		}
		existingItem.Quantity += req.Quantity
		return c.JSON(existingItem)
	} else if err != mongo.ErrNoDocuments {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to check cart"})
	}

	// Item does not exist, insert new
	newItem := models.CartItem{
		ID:        uuid.New().String(),
		UserID:    req.UserID,
		ProductID: req.ProductID,
		Quantity:  req.Quantity,
	}

	_, err = db.CartCollection.InsertOne(ctx, newItem)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to add item to cart"})
	}

	return c.JSON(newItem)
}
