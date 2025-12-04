package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	MongoClient                      *mongo.Client
	UserCollection                   *mongo.Collection
	ProductCollection                *mongo.Collection
	CategoryCollection               *mongo.Collection
	CampaignCollection               *mongo.Collection
	CampaignCategoryCollection       *mongo.Collection
	CampaignTargetCategoryCollection *mongo.Collection
	CartCollection                   *mongo.Collection
)

func ConnectMongo(mongoURL, dbName string) error {
	if mongoURL == "" {
		return fmt.Errorf("mongo url is empty")
	}
	if dbName == "" {
		return fmt.Errorf("mongo db name is empty")
	}

	//setup client
	clientOptions := options.Client().ApplyURI(mongoURL)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	//try ping
	if err := client.Ping(ctx, nil); err != nil {
		return err
	}

	log.Println("Connect to MongoDB successful")

	MongoClient = client
	db := client.Database(dbName)
	UserCollection = db.Collection("Users")
	ProductCollection = db.Collection("Products")
	CampaignCollection = db.Collection("Campaigns")
	CategoryCollection = db.Collection("ProductCategories")
	CategoryCollection = db.Collection("ProductCategories")
	CampaignCategoryCollection = db.Collection("CampaignCategories")
	CampaignTargetCategoryCollection = db.Collection("CampaignTargetCategories")
	CartCollection = db.Collection("cart_items")

	return nil
}
