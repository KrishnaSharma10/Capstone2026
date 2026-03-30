package service

import (
	"os"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/hod/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/hod/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func LoginHod(c *fiber.Ctx) error {
	input := new(model.Hod)

	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for Hod Login"})
	}

	hod, err := repository.GetHodDetailsByEmail(input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(400).JSON(fiber.Map{"error": "HOD doesnt exist by this email"})
		}
		return c.Status(400).JSON(fiber.Map{"error": "Some error occured while logging in for Hod"})
	}

	//compare password
	err = bcrypt.CompareHashAndPassword([]byte(hod.Password), []byte(input.Password))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid password for Hod"})
	}

	//generating JWT token
	claims := jwt.MapClaims{
		"email": input.Email,
		"role":  "hod",
		"exp":   time.Now().Add(time.Hour * 1).Unix(), // Token expires in 1 hour
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_KEY := os.Getenv("JWT_KEY")
	tokenString, err := token.SignedString([]byte(JWT_KEY))

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Could not create JWT token for Hod"})
	}

	return c.Status(202).JSON(fiber.Map{"token": tokenString, "hodData": hod})
}

func CreateCoordinator(c *fiber.Ctx) error {
	input := new(model.Coordinator)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for Coordinator creation"})
	}
	//check if email exist

	//add tenure details and password encryption
	hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	input.Password = string(hash)
	input.TenureStart = time.Now().Format("2006-01-02")
	input.TenureEnd = "present"

	err := repository.CreateCoordinatorDB(input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cannot create coordinator account"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"Status": "Coordinator account created successfully"})
}

func UpdateHodName(c *fiber.Ctx) error {
	input := new(model.Hod)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for Hod name Update"})
	}

	err := repository.UpdateHodName(input.Email, input.Name)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"Status": "Hod name updated"})
}

func UpdateHodPassword(c *fiber.Ctx) error {
	input := new(model.PasswordUpdation)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for Hod password Update"})
	}

	hod, err := repository.GetHodDetailsByEmail(input.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "HOD doesnt exist by this email"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Some error occured while password updation for Hod"})
	}

	//compare password
	err = bcrypt.CompareHashAndPassword([]byte(hod.Password), []byte(input.OldPassword))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password for Hod"})
	}

	err = repository.SetHODPassword(input.Email, input.NewPassword)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"Status": "Hod password updated"})
}

func GetAllCoordinatorsDetails(c *fiber.Ctx) error {
	allCoordinators, err := repository.AllCoordinatorsInDB()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"Error": err})
	}
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"data": allCoordinators})
}

func DeleteCoordinator(c *fiber.Ctx) error {
	input := new(model.Coordinator)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for Coordinator deletion"})
	}

	err := repository.DeleteCoordinatorInDB(input.Email)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"Status": "Coordinator successfulle deleted"})
}
