package models

import (
	"time"
)

// User represents a sanitized user document sent to clients.
type User struct {
	ID            string    `json:"id" bson:"_id,omitempty"`
	Email         string    `json:"email" bson:"email"`
	FirstName     string    `json:"first_name" bson:"first_name"`
	LastName      string    `json:"last_name" bson:"last_name"`
	Password_hash string    `json:"-" bson:"password_hash"`
	CreatedAt     time.Time `json:"created_at" bson:"created_at"`
	LastLogin     time.Time `json:"last_login" bson:"last_login"`
}
