package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/doaa/service"
	"github.com/gofiber/fiber/v2"
)

func LoginDoaa(c *fiber.Ctx) error {
	return service.LoginDoaa(c)
}

func UpdateDoaaName(c *fiber.Ctx) error {
	return service.UpdateDoaaName(c)
}

func UpdateDoaaPassword(c *fiber.Ctx) error {
	return service.UpdateDoaaPassword(c)
}

func GetAllCoordinatorsDetails(c *fiber.Ctx) error {
	return service.GetAllCoordinatorsDetails(c)
}

// func GetAllApplications( c *fiber.Ctx) error {
// 	return service.GetAllApplications(c);
// }

func UpdateApplication(c *fiber.Ctx) error {
	return service.UpdateApplication(c)
}
