package handlers

import (
	"context"
	"errors"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type RegisterProduct struct {
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	ProductCategoryID string  `json:"product_category_id"`
	Price             float64 `json:"price"`
}

// AddProduct godoc
// @Summary Create a new product
// @Description Adds a product with category and optional description.
// @Tags Products
// @Accept json
// @Produce json
// @Param product body RegisterProduct true "Product payload"
// @Success 201 {object} models.Product
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /products [post]
func AddProduct(c *fiber.Ctx) error {
	var req RegisterProduct
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Name == "" || req.ProductCategoryID == "" || req.Price <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Incomplete product details"})
	}

	product := models.Product{
		ID:                uuid.New().String(),
		Name:              req.Name,
		Description:       req.Description,
		ProductCategoryID: req.ProductCategoryID,
		Price:             req.Price,
		IsActive:          true,
		CreatedAt:         time.Now(),
	}

	// Check duplicate email
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing models.Product
	err := db.ProductCollection.FindOne(ctx, bson.M{"name": req.Name}).Decode(&existing)
	if err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Product name already registered"})
	}
	if !errors.Is(err, mongo.ErrNoDocuments) {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to check existing user"})
	}

	// Insert into database
	_, err = db.ProductCollection.InsertOne(ctx, product)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create product"})
	}

	return c.JSON(fiber.Map{"status": "product added"})
}
