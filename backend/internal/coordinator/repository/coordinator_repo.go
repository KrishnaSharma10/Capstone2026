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

	updateFields := bson.M{
		"stage":    application.Stage,
		"comments": application.Comments,
	}

	// ── When approving (stage → 5), stamp the current timetable version ──
	if application.Stage == 5 {
		metaCollection := database.MongoDB.Collection("metadata")
		metaCtx, metaCancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer metaCancel()

		var meta struct {
			Version string `bson:"version"`
		}
		err := metaCollection.FindOne(metaCtx, bson.M{"_id": "timetable_version"}).Decode(&meta)
		if err == nil && meta.Version != "" {
			updateFields["approved_at_version"] = meta.Version
		} else {
			// Fallback: use current timestamp if metadata not yet populated
			updateFields["approved_at_version"] = time.Now().UTC().Format("20060102150405")
		}
	}

	update := bson.M{"$set": updateFields}
	_, err := applicationDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update application: %w", err)
	}

	return nil
}
