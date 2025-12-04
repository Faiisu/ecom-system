package models

type Campaign struct {
	ID                 string            `json:"id" bson:"_id,omitempty"`
	Name               string            `json:"name" bson:"name"`
	Description        string            `json:"description,omitempty" bson:"description,omitempty"`
	DiscountType       string            `json:"discount_type" bson:"discount_type"` // "percent", "fixed", "point", "spendAndSave"
	DiscountValue      float64           `json:"discount_value" bson:"discount_value"`
	Limit              float64           `json:"limit" bson:"limit"`
	Every              float64           `json:"every" bson:"every"`
	CampaignCategoryID string            `json:"campaign_category_id" bson:"campaign_category_id"`
	IsActive           bool              `json:"is_active" bson:"is_active"`
	ProductCategories  []ProductCategory `json:"product_categories" bson:"product_categories"`
}

type CampaignTargetCategory struct {
	CampaignID        string `json:"campaign_id" bson:"campaign_id"`
	ProductCategoryID string `json:"product_category_id" bson:"product_category_id"`
}

type CampaignsCategories struct {
	ID          string `json:"id" bson:"_id,omitempty"`
	Name        string `json:"name" bson:"name"`
	Description string `json:"description" bson:"description"`
	Rank        int    `json:"rank" bson:"rank"`
}
