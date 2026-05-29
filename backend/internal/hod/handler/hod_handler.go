package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/hod/service"
	"github.com/gofiber/fiber/v2"
)

func LoginHod(c *fiber.Ctx) error {
	return service.LoginHod(c)
}

func CreateCoordinator(c *fiber.Ctx) error {
	return service.CreateCoordinator(c)
}

func UpdateHodName(c *fiber.Ctx) error {
	return service.UpdateHodName(c)
}

func UpdateHodPassword(c *fiber.Ctx) error {
	return service.UpdateHodPassword(c)
}

func GetAllCoordinatorsDetails(c *fiber.Ctx) error {
	return service.GetAllCoordinatorsDetails(c)
}

func DeleteCoordinator(c *fiber.Ctx) error {
	return service.DeleteCoordinator(c)
}
func GetApplicationsForHod(c *fiber.Ctx) error {
	return service.GetApplicationsForHod(c)
}
