package handler

import (
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/student/service"
	"github.com/gofiber/fiber/v2"
)

var electiveBasketList []string
var subgroupList []string

func RegisterStudent(c *fiber.Ctx) error {
	return service.CreateStudent(c)
}

func LoginStudent(c *fiber.Ctx) error {
	return service.LoginStudent(c)
}

func GenerateTimeTable(c *fiber.Ctx) error {
	return service.GetTimeTable(c)
}

func RetrieveElectiveBasket() error {
	var err error
	electiveBasketList, err = service.RetrieveElectiveBasket()
	return err
}

func RetrieveSubgroup() error {
	var err error
	subgroupList, err = service.RetrieveSubgroup()
	return err
}

func GetElectiveBasket(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"electiveBasketList": electiveBasketList})
}

func GetSubgroup(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"subgroupList": subgroupList})
}

func UploadFeeReciept(c *fiber.Ctx) error {
	return service.UploadReceipt(c)
}

func UpdateDetails(c *fiber.Ctx) error {
	return service.UpdateDetails(c)
}

func GetElectiveData(c *fiber.Ctx) error {
	return service.GetElectiveData(c)
}

func CreateApplication(c *fiber.Ctx) error {
	return service.CreateApplication(c)
}

func GetAllApplicationsByEmail(c *fiber.Ctx) error {
	return service.GetAllApplicationsByEmail(c)
}
