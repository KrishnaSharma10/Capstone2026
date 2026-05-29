package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/hod/model"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func GetHodDetailsByEmail(email string) (model.Hod, error) {
	hodDetails := database.MongoDB.Collection("hodDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// fmt.Println(email)
	var hod model.Hod
	filter := bson.M{"hod_email": email}

	err := hodDetails.FindOne(ctx, filter).Decode(&hod)
	if err != nil {
		return model.Hod{}, err
	}

	return hod, nil
}

func SetHODPassword(email string, password string) error {
	hodDetails := database.MongoDB.Collection("hodDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return fmt.Errorf("Failed to generate hash for password: %v", err)
	}

	filter := bson.M{"hod_email": email}
	update := bson.M{"$set": bson.M{"hod_password": string(hash)}}

	result, err := hodDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update password for hod: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no hod document found to update")
	}

	return nil
}

func UpdateHodName(email string, name string) error {
	hodDetails := database.MongoDB.Collection("hodDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"hod_email": email}
	update := bson.M{"$set": bson.M{"hod_name": name}}

	result, err := hodDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update name for hod: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no hod document found to update")
	}

	return nil
}

func CreateCoordinatorDB(coordinator *model.Coordinator) error {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := coordinatorDetails.InsertOne(ctx, coordinator)
	if err != nil {
		return err
	}

	return nil
}

func AllCoordinatorsInDB() ([]model.Coordinator, error) {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := coordinatorDetails.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch coordinators: %v", err)
	}
	defer cursor.Close(ctx)

	var coordinators []model.Coordinator
	for cursor.Next(ctx) {
		var coordinator model.Coordinator
		if err := cursor.Decode(&coordinator); err != nil {
			return nil, fmt.Errorf("failed to decode coordinator: %v", err)
		}
		coordinators = append(coordinators, coordinator)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over coordinators: %v", err)
	}

	return coordinators, nil
}

func DeleteCoordinatorInDB(email string) error {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"email": email}
	result, err := coordinatorDetails.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete coordinator: %v", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("no coordinator found with email: %s", email)
	}

	return nil
}
func GetCoordinatorsByDepartment(department string) ([]model.Coordinator, error) {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := coordinatorDetails.Find(ctx, bson.M{"department": department})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch coordinators: %v", err)
	}
	defer cursor.Close(ctx)

	var coordinators []model.Coordinator
	for cursor.Next(ctx) {
		var coordinator model.Coordinator
		if err := cursor.Decode(&coordinator); err != nil {
			return nil, fmt.Errorf("failed to decode coordinator: %v", err)
		}
		coordinators = append(coordinators, coordinator)
	}

	return coordinators, nil
}

func GetCoordinatorDepartment(email string) (string, error) {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var coordinator model.Coordinator
	err := coordinatorDetails.FindOne(ctx, bson.M{"email": email}).Decode(&coordinator)
	if err != nil {
		return "", fmt.Errorf("coordinator not found: %v", err)
	}

	return coordinator.Department, nil
}

func DeleteCoordinatorInDBByDepartment(email string, department string) error {
	coordinatorDetails := database.MongoDB.Collection("coordinatorDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"email": email, "department": department}
	result, err := coordinatorDetails.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete coordinator: %v", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("no coordinator found with email %s in your department", email)
	}

	return nil
}
func GetApplicationsByDepartment(department string) ([]bson.M, error) {
	applicationDetails := database.MongoDB.Collection("applicationDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := applicationDetails.Find(ctx, bson.M{"department": department})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch applications: %v", err)
	}
	defer cursor.Close(ctx)

	var applications []bson.M
	if err := cursor.All(ctx, &applications); err != nil {
		return nil, fmt.Errorf("failed to decode applications: %v", err)
	}

	return applications, nil
}
