package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/coordinator/service"
	"github.com/gofiber/fiber/v2"
)

func LoginCoordinator(c *fiber.Ctx) error {
	return service.LoginCoordinator(c)
}

func UpdateCoordinatorPassword(c *fiber.Ctx) error {
	return service.UpdateCoordinatorPassword(c)
}

func UpdateApplication(c *fiber.Ctx) error {
	return service.UpdateApplication(c)
}

func UpdateAllApplication(c *fiber.Ctx) error {
	return service.UpdateAllApplication(c)
}
func GetApplicationsForCoordinator(c *fiber.Ctx) error {
	return service.GetApplicationsForCoordinator(c)
}
