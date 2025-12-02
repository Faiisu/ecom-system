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
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message string              `json:"Message"`
	User    RegisterUserPayload `json:"user"`
}

type userDocument struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Email        string             `bson:"email"`
	PasswordHash string             `bson:"password_hash"`
	FirstName    string             `bson:"first_name"`
	LastName     string             `bson:"last_name"`
	CreatedAt    time.Time          `bson:"created_at"`
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
func Register(c *fiber.Ctx) error {
	// Parse and validate request
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request"})
	}

	//validate email and password
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Incomplete registration details"})
	}

	//Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to process password"})
	}

	user := models.User{
		ID:            uuid.New().String(),
		Email:         req.Email,
		Password_hash: string(hashedPassword),
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		CreatedAt:     time.Now(),
	}

	// Check duplicate email
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing models.User
	err = db.UserCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existing)
	if err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Email already registered"})
	}
	if !errors.Is(err, mongo.ErrNoDocuments) {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to check existing user"})
	}

	// Insert into database
	_, err = db.UserCollection.InsertOne(context.Background(), user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to create user"})
	}

	resp := make(map[string]string)
	resp["Message"] = "User registered successfully"

	return c.Status(fiber.StatusCreated).JSON(resp)
}

// Login godoc
// @Summary Login a user
// @Description Authenticates a user with email and password.
// @Tags Auth
// @Accept json
// @Produce json
// @Param login body loginRequest true "Login payload"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /Login [post]
func Login(c *fiber.Ctx) error {

	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Invalid request"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "Email and password are required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := db.UserCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{Error: "Invalid email or password"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "Failed to fetch user"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password_hash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{Error: "Invalid email or password"})
	}

	resp := LoginResponse{
		Message: "Login successful",
		User: RegisterUserPayload{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
		},
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}
