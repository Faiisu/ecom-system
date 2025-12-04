package handlers

import (
	"context"
	"time"

	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LoginResponse struct {
	Message string              `json:"Message"`
	User    RegisterUserPayload `json:"user"`
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
// @Summary Register a new user
// @Description Creates a new user account with hashed password.
// @Tags Auth
// @Accept json
// @Produce json
// @Param register body RegisterRequest true "Register payload"
// @Success 201 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /register [post]
func GuestRegister(c *fiber.Ctx) error {
	guestID := uuid.New().String()

	user := models.User{
		ID:            guestID,
		Email:         "guest_" + guestID + "@anonymous.com",
		Password_hash: "",
		FirstName:     "Guest",
		LastName:      "User",
		CreatedAt:     time.Now(),
		LastLogin:     time.Now(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.UserCollection.InsertOne(ctx, user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create user"})
	}

	resp := make(map[string]string)
	resp["ID"] = user.ID
	resp["message"] = "User registered successfully"

	return c.Status(fiber.StatusCreated).JSON(resp)
}
