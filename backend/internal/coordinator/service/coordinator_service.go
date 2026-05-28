package service

import (
	"fmt"
	"os"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/coordinator/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/coordinator/repository"
	studentModel "github.com/KrishnaSharma10/Capstone2026/backend/internal/student/model"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func LoginCoordinator(c *fiber.Ctx) error {
	input := new(model.Coordinator)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for Coordinator Login"})
	}

	coordinator, err := repository.GetCoordinatorDetailsByEmail(input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(400).JSON(fiber.Map{"error": "Coordinator doesnt exist by this email"})
		}
		return c.Status(400).JSON(fiber.Map{"error": "Some error occured while logging in for coordinator"})
	}

	//compare password
	err = bcrypt.CompareHashAndPassword([]byte(coordinator.Password), []byte(input.Password))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid password for coordinator"})
	}

	//generating JWT token
	claims := jwt.MapClaims{
		"email": input.Email,
		"role":  "coordinator",
		"exp":   time.Now().Add(time.Hour * 1).Unix(), // Token expires in 1 hour
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_KEY := os.Getenv("JWT_KEY")
	tokenString, err := token.SignedString([]byte(JWT_KEY))

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Could not create JWT token for coordinator"})
	}

	return c.Status(202).JSON(fiber.Map{"token": tokenString, "coordinatorData": coordinator})
}

func UpdateCoordinatorPassword(c *fiber.Ctx) error {
	input := new(model.PasswordUpdation)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for Coordinator Password change"})
	}

	coordinator, err := repository.GetCoordinatorDetailsByEmail(input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(400).JSON(fiber.Map{"error": "Coordinator doesnt exist by this email"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Some error occured while password updation for coordinator"})
	}

	//compare password
	err = bcrypt.CompareHashAndPassword([]byte(coordinator.Password), []byte(input.OldPassword))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password for coordinator"})
	}

	err = repository.SetCoordinatorPassword(input.Email, input.NewPassword)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"Status": "Coordinator password updated"})
}

func UpdateApplication(c *fiber.Ctx) error {
	input := new(studentModel.Application)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for Application Acceptance/Rejection by Coordinator"})
	}
	fmt.Println(input)

	err := repository.UpdateApplicationinDB(input)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"Error": "Applicated not successfully accepted/rejected"})
	}
	return c.Status(200).JSON(fiber.Map{"Status": "Application successfully accepted/rejected."})
}

func UpdateAllApplication(c *fiber.Ctx) error {
	input := new(studentModel.ApplicationList)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for Application Acceptance/Rejection by Coordinator"})
	}

	for _, app := range input.Applications {
		// fmt.Println("Application ID:", app.ApplicationId)
		// fmt.Println("Name:", app.Name)
		// fmt.Println("Email:", app.Email)
		// fmt.Println("Stage:", app.Stage)
		// fmt.Println("Comments:", app.Comments)
		// fmt.Println("-----------------------------")

		err := repository.UpdateApplicationinDB(&app)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"Error": "Applications not successfully accepted/rejected"})
		}
	}

	return c.Status(200).JSON(fiber.Map{"Status": "Applications successfully accepted/rejected."})

	// err := repository.UpdateApplicationinDB(input);
	// if err!= nil{
	// 	return c.Status(400).JSON(fiber.Map{"Error": "Applicated not successfully accepted/rejected"})
	// }
	// return c.Status(200).JSON(fiber.Map{"Status": "Application successfully accepted/rejected."})
}
func GetApplicationsForCoordinator(c *fiber.Ctx) error {
	var input struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}
	if input.Email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required field: email"})
	}

	coordinator, err := repository.GetCoordinatorDetailsByEmail(input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Coordinator not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching coordinator details"})
	}

	applications, err := repository.GetApplicationsByDepartment(coordinator.Department)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(200).JSON(fiber.Map{"data": applications})
}
