package models

import "time"

type TransactionHistory struct {
	ID        string    `json:"id" bson:"_id,omitempty"`
	UserID    string    `json:"user_id" bson:"user_id"`
	PointUsed int       `json:"point_used" bson:"point_used"`
	Date      time.Time `json:"date" bson:"date"`
}

type TransactionHistoryProduct struct {
	HistoryID string `json:"history_id" bson:"history_id"`
	ProductID string `json:"product_id" bson:"product_id"`
}

type TransactionHistoryCampaign struct {
	HistoryID  string `json:"history_id" bson:"history_id"`
	CampaignID string `json:"campaign_id" bson:"campaign_id"`
}
