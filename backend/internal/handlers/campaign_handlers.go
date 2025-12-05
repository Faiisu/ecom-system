// internal/handlers/campaign_handlers.go
package handlers

import (
	"context"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RegisterCampaign struct {
	Name                  string   `json:"name"`
	Description           string   `json:"description"`
	DiscountType          string   `json:"discount_type"`
	DiscountValue         float64  `json:"discount_value"`
	Limit                 float64  `json:"limit"`
	Every                 float64  `json:"every"`
	CampaignCategoryID    string   `json:"campaign_category_id"`
	IsActive              bool     `json:"is_active"`
	ListProductCategoryID []string `json:"list_product_category_id"`
}

type RegisterCampaignCategory struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Rank        int    `json:"rank"`
}

// AddCampaign godoc
// @Summary Create a new campaign
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param campaign body RegisterCampaign true "Campaign payload"
// @Success 201 {object} RegisterCampaign
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /campaigns [post]
func AddCampaign(c *fiber.Ctx) error {
	var req RegisterCampaign
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request"})
	}
	if req.Name == "" || req.DiscountType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Missing required fields"})
	}

	campaign := models.Campaign{
		ID:                 uuid.New().String(),
		Name:               req.Name,
		Description:        req.Description,
		DiscountType:       req.DiscountType,
		DiscountValue:      req.DiscountValue,
		Limit:              req.Limit,
		Every:              req.Every,
		CampaignCategoryID: req.CampaignCategoryID,
		IsActive:           req.IsActive,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := db.CampaignCollection.InsertOne(ctx, campaign); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create campaign"})
	}

	// Create CampaignTargetCategory records
	if len(req.ListProductCategoryID) > 0 {
		var targetCategories []interface{}
		for _, catID := range req.ListProductCategoryID {
			targetCategories = append(targetCategories, models.CampaignTargetCategory{
				CampaignID:        campaign.ID,
				ProductCategoryID: catID,
			})
		}

		if _, err := db.CampaignTargetCategoryCollection.InsertMany(ctx, targetCategories); err != nil {
			// Note: In a production app, we might want to rollback the campaign creation here
			// or use a transaction. For now, we'll just log/return error.
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create campaign target categories"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(campaign)
}

// GetCampaigns godoc
// @Summary Get all campaigns
// @Tags Campaigns
// @Accept json
// @Produce json
// @Success 200 {array} models.Campaign
// @Failure 500 {object} ErrorResponse
// @Router /campaigns [get]
func GetCampaigns(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var campaigns []models.Campaign

	pipeline := mongo.Pipeline{
		{{Key: "$lookup", Value: bson.M{
			"from":         "CampaignTargetCategories",
			"localField":   "_id",
			"foreignField": "campaign_id",
			"as":           "target_categories",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "ProductCategories",
			"localField":   "target_categories.product_category_id",
			"foreignField": "_id",
			"as":           "product_categories",
		}}},
	}

	cursor, err := db.CampaignCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to fetch campaigns"})
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &campaigns); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to decode campaigns"})
	}

	// Ensure ProductCategories is an empty list if nil
	for i := range campaigns {
		if campaigns[i].ProductCategories == nil {
			campaigns[i].ProductCategories = []models.ProductCategory{}
		}
	}

	return c.JSON(campaigns)
}

// DeleteCampaign godoc
// @Summary Soft delete a campaign
// @Description Soft delete a campaign by ID (set is_active to false)
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param id path string true "Campaign ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /campaigns/{id} [delete]
func DeleteCampaign(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Campaign ID is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{"$set": bson.M{"is_active": false}}
	result, err := db.CampaignCollection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to delete campaign"})
	}

	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: "Campaign not found"})
	}

	return c.JSON(fiber.Map{"status": "Campaign deleted successfully"})
}

// ActivateCampaign godoc
// @Summary Activate a campaign
// @Description Activate a campaign by ID (set is_active to true)
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param id path string true "Campaign ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /campaigns/{id}/activate [patch]
func ActivateCampaign(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Campaign ID is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{"$set": bson.M{"is_active": true}}
	result, err := db.CampaignCollection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to activate campaign"})
	}

	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: "Campaign not found"})
	}

	return c.JSON(fiber.Map{"status": "Campaign activated successfully"})
}

// AddCampaignCategory godoc
// @Summary Create a new campaign category
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param category body RegisterCampaignCategory true "Category payload"
// @Success 201 {object} RegisterCampaignCategory
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /campaign-categories [post]
func AddCampaignCategory(c *fiber.Ctx) error {
	var req RegisterCampaignCategory
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request"})
	}
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Name is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := db.CampaignCategoryCollection.InsertOne(ctx, req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create campaign category"})
	}
	return c.Status(fiber.StatusCreated).JSON(req)
}

// GetCampaignCategories godoc
// @Summary Get all campaign categories
// @Tags Campaigns
// @Accept json
// @Produce json
// @Success 200 {array} models.CampaignsCategories
// @Failure 500 {object} ErrorResponse
// @Router /campaign-categories [get]
func GetCampaignCategories(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var categories []models.CampaignsCategories
	cursor, err := db.CampaignCategoryCollection.Find(ctx, fiber.Map{})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to fetch categories"})
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &categories); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to decode categories"})
	}

	return c.JSON(categories)
}

type RealignCategoryRequest struct {
	CategoryID string `json:"category_id"`
	Rank       int    `json:"rank"`
}

// RealignCampaignCategoryRanks godoc
// @Summary Realign campaign category ranks
// @Description Update ranks for multiple campaign categories
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param body body []RealignCategoryRequest true "List of categories with new ranks"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /campaign-categories/realign [patch]
func RealignCampaignCategoryRanks(c *fiber.Ctx) error {
	var req []RealignCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request body"})
	}

	if len(req) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Request body cannot be empty"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Use a transaction or bulk write for atomicity if possible, but for now we'll iterate
	// MongoDB bulk write is better here
	var writes []mongo.WriteModel
	for _, item := range req {
		if item.CategoryID == "" {
			continue
		}

		objID, err := primitive.ObjectIDFromHex(item.CategoryID)
		if err != nil {
			// Skip invalid IDs or handle error
			continue
		}

		model := mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": objID}).
			SetUpdate(bson.M{"$set": bson.M{"rank": item.Rank}})
		writes = append(writes, model)
	}

	if len(writes) > 0 {
		_, err := db.CampaignCategoryCollection.BulkWrite(ctx, writes)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to update ranks"})
		}
	}

	return c.JSON(fiber.Map{"status": "Ranks updated successfully"})
}
