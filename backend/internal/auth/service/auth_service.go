package service

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/bson"
)

func VerifyStudent(c *fiber.Ctx) error {
	tokenString := c.Query("token")

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_KEY")), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid or expired token")
	}

	claims := token.Claims.(jwt.MapClaims)
	email := claims["email"].(string)

	// Update user to set verified = true
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"thapar_email": email}
	update := bson.M{"$set": bson.M{"verified": true}}

	_, err = database.MongoDB.Collection("studentDetails").UpdateOne(ctx, filter, update)
	if err != nil {
		return c.Status(500).SendString("Failed to verify email")
	}

	return c.SendString("Email verified successfully!")
}

func JWTMiddleware(c *fiber.Ctx) error {
	tokenStr := c.Get("Authorization")
	if tokenStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
	}

	tokenStr = strings.Replace(tokenStr, "Bearer ", "", 1)
	secret := os.Getenv("JWT_KEY")

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	//Check expiry manually
	if exp, ok := claims["exp"].(float64); ok {
		if time.Unix(int64(exp), 0).Before(time.Now()) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token expired"})
		}
	}

	c.Locals("email", claims["email"])
	c.Locals("role", claims["role"])

	return c.Next()
}
