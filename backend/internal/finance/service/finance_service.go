package service

import (
	"fmt"
	"os"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/bson"
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

func GetPendingFeeApplications(c *fiber.Ctx) error {
	applications, err := repository.GetPendingFeeApplications()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": applications})
}

func UpdateApplication(c *fiber.Ctx) error {
	var application bson.M
	if err := c.BodyParser(&application); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse application"})
	}
	fmt.Println("Received application_id:", application["application_id"])
	fmt.Println("Received stage:", application["stage"])
	fmt.Println("_id field:", application["_id"])

	if err := repository.UpdateFinanceApplication(application); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "Application updated"})
}

func UpdateAllApplications(c *fiber.Ctx) error {
	var body struct {
		Applications []bson.M `json:"applications"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse applications"})
	}
	if err := repository.UpdateAllFinanceApplications(body.Applications); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "All applications updated"})
}
