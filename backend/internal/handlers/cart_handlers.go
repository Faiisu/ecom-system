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

// GetCartItems godoc
// @Summary Get cart items for a user
// @Description Retrieve all items in a user's cart with product details
// @Tags Cart
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {array} map[string]interface{}
// @Failure 500 {object} ErrorResponse
// @Router /cart/{user_id} [get]
func GetCartItems(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"user_id": userID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "Products",
			"localField":   "product_id",
			"foreignField": "_id",
			"as":           "product",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$product",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$project", Value: bson.M{
			"id":            "$_id",
			"product_id":    1,
			"quantity":      1,
			"product_name":  "$product.name",
			"product_price": "$product.price",
		}}},
	}

	cursor, err := db.CartCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to fetch cart items"})
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to decode cart items"})
	}

	// Ensure empty list instead of null
	if results == nil {
		results = []bson.M{}
	}

	return c.JSON(results)
}

type DeleteCartItemRequest struct {
	UserID    string `json:"user_id"`
	ProductID string `json:"product_id"`
}

// DeleteCartItem godoc
// @Summary Remove item from cart
// @Description Removes a product from the user's cart
// @Tags Cart
// @Accept json
// @Produce json
// @Param cartItem body DeleteCartItemRequest true "Delete Cart Item payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cart [delete]
func DeleteCartItem(c *fiber.Ctx) error {
	var req DeleteCartItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request body"})
	}

	if req.UserID == "" || req.ProductID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "user_id and product_id are required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"user_id":    req.UserID,
		"product_id": req.ProductID,
	}

	result, err := db.CartCollection.DeleteOne(ctx, filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to delete cart item"})
	}

	if result.DeletedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: "Item not found in cart"})
	}

	return c.JSON(fiber.Map{"message": "Item removed from cart"})
}
