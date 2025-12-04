package routes

import (
	"github.com/faiisu/ecom-backend/internal/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/health", handlers.HealthCheck)

	app.Get("/guestlogin", handlers.GuestRegister)
	app.Post("/products", handlers.AddProduct)
	app.Get("/products", handlers.GetProducts)
	app.Post("/campaigns", handlers.AddCampaign)
	app.Get("/campaigns", handlers.GetCampaigns)
	app.Delete("/campaigns/:id", handlers.DeleteCampaign)
	app.Patch("/campaigns/:id/activate", handlers.ActivateCampaign)
	app.Post("/product-categories", handlers.AddProductCategory)
	app.Get("/product-categories", handlers.GetProductCategories)
	app.Delete("/product-categories/:id", handlers.DeleteProductCategory)
	app.Post("/campaign-categories", handlers.AddCampaignCategory)
	app.Get("/campaign-categories", handlers.GetCampaignCategories)
}
