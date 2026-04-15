package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/service"
	"github.com/gofiber/fiber/v2"
)

func LoginFinance(c *fiber.Ctx) error {
	return service.LoginFinance(c)
}

func GetPendingFeeApplications(c *fiber.Ctx) error {
	return service.GetPendingFeeApplications(c)
}

func UpdateApplication(c *fiber.Ctx) error {
	return service.UpdateApplication(c)
}

func UpdateAllApplications(c *fiber.Ctx) error {
	return service.UpdateAllApplications(c)
}
