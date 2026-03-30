package service

import (
	"os"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func LoginFinance(c *fiber.Ctx) error {
	input := new(model.Finance)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for Finance Login"})
	}

	finance, err := repository.GetFinanceDetailsByEmail(input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Finance user not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error during Finance login"})
	}

	err = bcrypt.CompareHashAndPassword([]byte(finance.Password), []byte(input.Password))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password"})
	}

	claims := jwt.MapClaims{
		"email": input.Email,
		"role":  "finance",
		"exp":   time.Now().Add(time.Hour * 1).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_KEY")))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create JWT token"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"token": tokenString, "financeData": finance})
}
