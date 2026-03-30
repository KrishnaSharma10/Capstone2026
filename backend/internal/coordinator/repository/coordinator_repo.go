package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/coordinator/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	studentModel "github.com/KrishnaSharma10/Capstone2026/backend/internal/student/model"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func GetCoordinatorDetailsByEmail(email string) (model.Coordinator, error) {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var coordinator model.Coordinator
	filter := bson.M{"email": email}

	err := coordinatorDetails.FindOne(ctx, filter).Decode(&coordinator)
	if err != nil {
		return model.Coordinator{}, err
	}

	return coordinator, nil
}

func SetCoordinatorPassword(email string, password string) error {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return fmt.Errorf("Failed to generate hash for password: %v", err)
	}

	filter := bson.M{"email": email}
	update := bson.M{"$set": bson.M{"password": string(hash)}}

	result, err := coordinatorDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update password for coordinator: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no coordinator document found to update")
	}

	return nil
}

func UpdateApplicationinDB(application *studentModel.Application) error {
	applicationDetails := database.MongoDB.Collection("applicationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	fmt.Println(application.ApplicationId)
	filter := bson.M{"application_id": application.ApplicationId}
	update := bson.M{"$set": bson.M{"stage": application.Stage, "comments": application.Comments}}

	_, err := applicationDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update application: %w", err)
	}

	// if result.MatchedCount == 0 {
	// 	fmt.Println("No matching document found for update.")
	// } else if result.ModifiedCount == 0 {
	// 	fmt.Println("Document matched but stage was not updated (possibly same value).")
	// } else {
	// 	fmt.Println("Update successful.")
	// }

	return nil
}
