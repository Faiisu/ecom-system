package models

type Campaign struct {
	ID            string  `json:"id" bson:"_id,omitempty"`
	Name          string  `json:"name" bson:"name"`
	Description   string  `json:"description,omitempty" bson:"description,omitempty"`
	DiscountType  string  `json:"discount_type" bson:"discount_type"` // "percent", "fixed", "userPoint"
	DiscountValue float64 `json:"discount_value" bson:"discount_value"`
	IsActive      bool    `json:"is_active" bson:"is_active"`
}

type CampaignTargetCategory struct {
	CampaignID        string `json:"campaign_id" bson:"campaign_id"`
	ProductCategoryID string `json:"product_category_id" bson:"product_category_id"`
}
