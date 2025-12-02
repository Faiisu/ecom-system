package models

import "time"

type Product struct {
	ID                string    `json:"id" bson:"_id,omitempty"`
	Name              string    `json:"name" bson:"name"`
	Description       string    `json:"description,omitempty" bson:"description,omitempty"`
	ProductCategoryID string    `json:"product_category_id" bson:"product_category_id"`
	Price             float64   `json:"price" bson:"price"`
	IsActive          bool      `json:"is_active" bson:"is_active"`
	CreatedAt         time.Time `json:"created_at" bson:"created_at"`
}

type ProductCategory struct {
	ID   string `json:"id" bson:"_id,omitempty"`
	Name string `json:"name" bson:"name"`
}
