package repository

import (
	"context"
	"fmt"
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

func GetPendingFeeApplications() ([]bson.M, error) {
	col := database.MongoDB.Collection("applicationDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"stage": 4}
	cursor, err := col.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("error fetching pending applications: %v", err)
	}
	defer cursor.Close(ctx)

	var applications []bson.M
	if err := cursor.All(ctx, &applications); err != nil {
		return nil, fmt.Errorf("error decoding applications: %v", err)
	}
	return applications, nil
}

func UpdateFinanceApplication(application bson.M) error {
	col := database.MongoDB.Collection("applicationDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"application_id": application["application_id"]}
	update := bson.M{"$set": application}

	fmt.Println("Filter:", filter)

	result, err := col.UpdateOne(ctx, filter, update)
	fmt.Println("MatchedCount:", result.MatchedCount, "ModifiedCount:", result.ModifiedCount)

	if err != nil {
		return fmt.Errorf("error updating application: %v", err)
	}
	if result.MatchedCount == 0 {
		return fmt.Errorf("no application found with that id")
	}
	return nil
}

func UpdateAllFinanceApplications(applications []bson.M) error {
	for _, app := range applications {
		if err := UpdateFinanceApplication(app); err != nil {
			return err
		}
	}
	return nil
}
