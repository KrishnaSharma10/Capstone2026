package repository

import (
	"context"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/model"
	"go.mongodb.org/mongo-driver/bson"
)

func GetFinanceDetailsByEmail(email string) (model.Finance, error) {
	col := database.MongoDB.Collection("financeDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var finance model.Finance
	err := col.FindOne(ctx, bson.M{"finance_email": email}).Decode(&finance)
	if err != nil {
		return model.Finance{}, err
	}
	return finance, nil
}
