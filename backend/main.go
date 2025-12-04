package main

import (
	"log"

	_ "github.com/faiisu/ecom-backend/docs"
	"github.com/faiisu/ecom-backend/internal/config"
	"github.com/faiisu/ecom-backend/internal/db"
	"github.com/faiisu/ecom-backend/internal/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	swagger "github.com/gofiber/swagger"
)

// @title Ecom backend api
// @version 1.0
// @description API endpoints for registering users.
// @host localhost:8080
// @BasePath /
func main() {
	cfg := config.LoadConfig()
	if err := db.ConnectMongo(cfg.MongoURL, cfg.MongoDBName); err != nil {
		log.Fatalf("failed to connect to MongoDB: %v", err)
	}
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://192.168.1.5:5173, http://localhost:5173",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Get("/swagger/*", swagger.HandlerDefault)

	routes.SetupRoutes(app)

	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
