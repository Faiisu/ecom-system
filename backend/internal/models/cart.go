package models

type CartItem struct {
	ID         string  `json:"id" bson:"_id,omitempty"`
	UserID     string  `json:"user_id" bson:"user_id"`
	ProductID  string  `json:"product_id" bson:"product_id"`
	Quantity   int     `json:"quantity" bson:"quantity"`
	PriceAtAdd float64 `json:"price_at_add" bson:"price_at_add"`
}

type CartCampaign struct {
	UserID     string `json:"user_id" bson:"user_id"`
	CampaignID string `json:"campaign_id" bson:"campaign_id"`
}
