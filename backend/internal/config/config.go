package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	MongoURL    string
	MongoDBName string
}

func LoadConfig() Config {
	_ = godotenv.Load() // Load .env file if it exists

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mongoURL := os.Getenv("MONGO_URL")
	if mongoURL == "" {
		log.Println("WARNING: MONGO_URL is empty")
	}

	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		log.Println("WARNING: MONGO_DB_NAME is empty")
	}

	return Config{
		Port:        port,
		MongoURL:    mongoURL,
		MongoDBName: dbName,
	}
}
