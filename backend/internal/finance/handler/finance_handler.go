package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/service"
	"github.com/gofiber/fiber/v2"
)

func LoginFinance(c *fiber.Ctx) error {
	return service.LoginFinance(c)
}
