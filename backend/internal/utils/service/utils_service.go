package service

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	utilsModel "github.com/KrishnaSharma10/Capstone2026/backend/internal/utils/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/utils/repository"
	"github.com/cloudinary/cloudinary-go"
	"github.com/cloudinary/cloudinary-go/api/uploader"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"gopkg.in/mail.v2"
)

func SendVerificationEmail(recipientEmail, token string) error {
	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := 587

	// Create message
	m := mail.NewMessage()
	m.SetHeader("From", m.FormatAddress(from, "Improvement Portal Server"))
	m.SetHeader("To", recipientEmail)
	m.SetHeader("Subject", "Please Verify Your Email Address - Improvement Course Management Portal")
	verificationLink := fmt.Sprintf("http://127.0.0.1:5000/verify?token=%s", token)

	m.SetBody("text/html", fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Email Verification</title>
		</head>
		<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
				<h2 style="color: #333333;">Welcome to the Improvement Portal!</h2>
				<p style="color: #555555; font-size: 16px;">
					Thank you for registering. To complete your signup, please verify your email address by clicking the button below:
				</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
						Verify Email
					</a>
				</div>
				<p style="color: #777777; font-size: 14px;">
					If the button above doesn't work, copy and paste the following link into your browser:
				</p>
				<p style="color: #777777; font-size: 14px; word-wrap: break-word;">
					%s
				</p>
				<p style="color: #999999; font-size: 12px; margin-top: 30px;">
					If you did not create an account, you can safely ignore this email.
				</p>
			</div>
		</body>
		</html>
	`, verificationLink, verificationLink))

	// Set up dialer
	d := mail.NewDialer(smtpHost, smtpPort, from, password)
	d.Timeout = 10 * time.Second // prevent hanging
	d.TLSConfig = &tls.Config{
		ServerName: "smtp.gmail.com",
	}

	// Send email
	if err := d.DialAndSend(m); err != nil {
		log.Printf("Failed to send email to %s: %v\n", recipientEmail, err)
		return err
	}

	fmt.Println("Verification email sent to:", recipientEmail)
	return nil
}

func UploadToCloudinary(file multipart.File, filename string) (string, error) {
	cloudName := os.Getenv("CLOUDINARY_URL")

	cld, err := cloudinary.NewFromURL(cloudName)
	if err != nil {
		return "", err
	}

	ctx := context.Background()

	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID:       filename,
		ResourceType:   "raw", // important for PDFs
		Folder:         "receipts",
		UseFilename:    true,
		UniqueFilename: false,
		Overwrite:      true,
	})

	if err != nil {
		fmt.Println(err)
		return "", err
	}

	return uploadResult.SecureURL, nil
}

func UploadToCloudinary2(file io.Reader, filename string) (string, error) {
	CLOUDINARY_API_KEY := os.Getenv("CLOUDINARY_API_KEY")
	CLOUDINARY_API_SECRET := os.Getenv("CLOUDINARY_API_SECRET")
	CLOUDINARY_CLOUD := os.Getenv("CLOUDINARY_CLOUD")

	cld, err := cloudinary.NewFromParams(CLOUDINARY_CLOUD, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
	if err != nil {
		return "", err
	}

	uploadRes, err := cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
		PublicID:     filename,
		ResourceType: "auto",
		Folder:       "fee_receipts",
	})
	if err != nil {
		return "", err
	}

	return uploadRes.SecureURL, nil
}

func GetCourseList(c *fiber.Ctx) error {
	return c.JSON(database.GetCourseList())
}

func UpdateCourse(c *fiber.Ctx) error {
	var body bson.M
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse request"})
	}

	id, ok := body["_id"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or missing _id"})
	}

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ObjectID format"})
	}

	delete(body, "_id")

	col := database.MongoDB.Collection("courseList")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := col.UpdateOne(ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": body},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Course not found"})
	}

	// reset cache so next fetch gets fresh data
	database.ResetCourseCache()

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "Course updated successfully"})
}

func GetApplicationDetails(c *fiber.Ctx) error {
	var input struct {
		ApplicationId string `json:"application_id" bson:"application_id"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if input.ApplicationId == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required field: application_id"})
	}

	application, err := repository.GetApplicationDetailsByID(input.ApplicationId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"Application Data": application})
}

func RejectApplicationById(c *fiber.Ctx) error {
	var input struct {
		ApplicationId string `json:"application_id" bson:"application_id"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if input.ApplicationId == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required field: application_id"})
	}

	err := repository.RejectApplicationById(input.ApplicationId)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(200).JSON(fiber.Map{"Status": "Application successfully rejected", "application_id": input.ApplicationId})
}

func GetApplicationStatusById(c *fiber.Ctx) error {
	var input struct {
		ApplicationId string `json:"application_id" bson:"application_id"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if input.ApplicationId == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required field: application_id"})
	}

	status, err := repository.GetApplicationStatusByID(input.ApplicationId)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(200).JSON(fiber.Map{"Status": status})
}

func GetAllApplications(c *fiber.Ctx) error {
	allApplications, err := repository.GetAllApplicationsinDB()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"Error": err})
	}
	return c.Status(200).JSON(fiber.Map{"data": allApplications})
}

func AddNotification(c *fiber.Ctx) error {
	var req utilsModel.Notification
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	notification, err := repository.PostANotification(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(notification)
}

func GetNotificationHandler(c *fiber.Ctx) error {
	notification, err := repository.GetNotification()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if notification.Title == "" && notification.Message == "" {
		return c.JSON(fiber.Map{
			"message": "No notification found",
		})
	}

	return c.JSON(notification)
}
