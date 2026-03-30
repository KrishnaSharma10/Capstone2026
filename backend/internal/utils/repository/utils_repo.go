package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/student/model"
	utilsModel "github.com/KrishnaSharma10/Capstone2026/backend/internal/utils/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetApplicationDetailsByID(applicationId string) (model.Application, error) {
	applicationDetails := database.MongoDB.Collection("applicationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"application_id": applicationId}

	var application model.Application
	err := applicationDetails.FindOne(ctx, filter).Decode(&application)
	if err != nil {
		return model.Application{}, err
	}
	return application, nil
}

func RejectApplicationById(id string) error {
	applicationDetails := database.MongoDB.Collection("applicationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"application_id": id}
	update := bson.M{"$set": bson.M{"stage": 10}}

	result, err := applicationDetails.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update application: %v", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no application found with id: %s", id)
	}

	return nil
}

func GetApplicationStatusByID(applicationId string) (int, error) {
	applicationDetails := database.MongoDB.Collection("applicationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"application_id": applicationId}
	projection := bson.M{"status": 1, "_id": 0}

	var result struct {
		Status int `bson:"status"`
	}

	err := applicationDetails.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result)
	if err != nil {
		return -1, err
	}
	return result.Status, nil
}

func GetAllApplicationsinDB() ([]model.Application, error) {
	applicationDetails := database.MongoDB.Collection("applicationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := applicationDetails.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var applications []model.Application

	for cursor.Next(ctx) {
		var app model.Application
		if err := cursor.Decode(&app); err != nil {
			return nil, err
		}
		applications = append(applications, app)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return applications, nil
}

func PostANotification(notification utilsModel.Notification) (utilsModel.Notification, error) {
	collection := database.MongoDB.Collection("notificationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	notification.CreatedAt = time.Now()

	filter := bson.M{}
	update := bson.M{"$set": notification}
	opts := options.Update().SetUpsert(true)

	_, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return utilsModel.Notification{}, err
	}

	var updated utilsModel.Notification
	if err := collection.FindOne(ctx, bson.M{}).Decode(&updated); err != nil {
		if err == mongo.ErrNoDocuments {
			return utilsModel.Notification{}, nil
		}
		return utilsModel.Notification{}, err
	}

	return updated, nil
}

func GetNotification() (utilsModel.Notification, error) {
	collection := database.MongoDB.Collection("notificationDetails")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var notification utilsModel.Notification
	err := collection.FindOne(ctx, bson.M{}).Decode(&notification)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			// No notification found, return empty struct (not an error)
			return utilsModel.Notification{}, nil
		}
		return utilsModel.Notification{}, err
	}

	return notification, nil
}
