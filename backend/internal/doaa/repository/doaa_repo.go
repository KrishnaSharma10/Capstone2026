package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/doaa/model"
	studentModel "github.com/KrishnaSharma10/Capstone2026/backend/internal/student/model"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func GetDoaaDetails() (model.Doaa, error) {
	doaaDetails := database.MongoDB.Collection("doaaDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var doaa model.Doaa

	err := doaaDetails.FindOne(ctx, bson.M{}).Decode(&doaa)
	if err != nil {
		fmt.Println(err)
		return model.Doaa{}, err
	}
	return doaa, nil
}

func SetDoaaPassword(password string) error {
	doaaDetails := database.MongoDB.Collection("doaaDetails")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return fmt.Errorf("Failed to generate hash for password: %v", err)
	}

	filter := bson.M{}
	update := bson.M{"$set": bson.M{"doaa_password": string(hash)}}

	result, err := doaaDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update password: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no doaa document found to update")
	}

	return nil
}

func UpdateDoaaName(doaa *model.Doaa) error {
	doaaDetails := database.MongoDB.Collection("doaaDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{}
	update := bson.M{"$set": bson.M{"doaa_name": doaa.Name}}

	result, err := doaaDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update doaa password: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no doaa document found to update")
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

// func GetAllApplicationsinDB() ([]model.Application, error) {
//     applicationDetails := database.MongoDB.Collection("applicationDetails")

//     ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
//     defer cancel()

//     cursor, err := applicationDetails.Find(ctx, bson.M{})
//     if err != nil {
//         return nil, err
//     }
//     defer cursor.Close(ctx)

//     var applications []model.Application

//     for cursor.Next(ctx) {
//         var app model.Application
//         if err := cursor.Decode(&app); err != nil {
//             return nil, err
//         }
//         applications = append(applications, app)
//     }

//     if err := cursor.Err(); err != nil {
//         return nil, err
//     }

//     return applications, nil
// }

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
