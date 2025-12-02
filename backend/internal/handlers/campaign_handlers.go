// internal/handlers/campaign_handlers.go
package handlers

import (
	"context"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// AddCampaign godoc
// @Summary Create a new campaign
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param campaign body models.Campaign true "Campaign payload"
// @Success 201 {object} models.Campaign
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /campaigns [post]
func AddCampaign(c *fiber.Ctx) error {
	var req models.Campaign
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request"})
	}
	if req.Name == "" || req.DiscountType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Missing required fields"})
	}

	req.ID = uuid.New().String()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := db.CampaignCollection.InsertOne(ctx, req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create campaign"})
	}
	return c.Status(fiber.StatusCreated).JSON(req)
}
