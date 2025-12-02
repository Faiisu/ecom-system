package routes

import (
	"github.com/faiisu/ecom-backend/internal/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/health", handlers.HealthCheck)

	app.Post("/register", handlers.Register)
	app.Post("/Login", handlers.Login)
	app.Post("/products", handlers.AddProduct)
	app.Post("/campaigns", handlers.AddCampaign)
	app.Post("/product-categories", handlers.AddProductCategory)
}
