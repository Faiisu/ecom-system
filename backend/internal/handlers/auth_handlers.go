package handlers

import (
	"context"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GuestLoginResponse struct {
	Message string `json:"Message"`
	ID      string `json:"id"`
	Point   int    `json:"point"`
}

type RegisterUserPayload struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// Register godoc
// @Summary Register a guest user
// @Description Creates a new guest user account.
// @Tags Auth
// @Accept json
// @Produce json
// @Success 201 {object} GuestLoginResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /guestregister [post]
func GuestRegister(c *fiber.Ctx) error {
	guestID := uuid.New().String()

	user := models.User{
		ID:            guestID,
		Email:         "guest_" + guestID + "@anonymous.com",
		Password_hash: "",
		FirstName:     "Guest",
		LastName:      "User",
		Point:         100,
		IsGuest:       true,
		CreatedAt:     time.Now(),
		LastLogin:     time.Now(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.UserCollection.InsertOne(ctx, user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create user"})
	}

	resp := GuestLoginResponse{
		Message: "User registered successfully",
		ID:      guestID,
		Point:   100,
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}
