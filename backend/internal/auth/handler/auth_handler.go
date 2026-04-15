package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/auth/service"
	"github.com/gofiber/fiber/v2"
)

func VerifyStudent(c *fiber.Ctx) error {
	return service.VerifyStudent(c)
}

func JWTMiddleware(c *fiber.Ctx) error {
	return service.JWTMiddleware(c)
}
