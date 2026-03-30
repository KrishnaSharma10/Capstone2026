package main

import (
	"log"
	"os"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/database"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/router"
	studentHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/student/handler"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using Render environment variables")
	}

	PORT := os.Getenv("PORT")
	database.ConnectMongo()
	database.GetCourseList()

	err = studentHandler.RetrieveElectiveBasket()
	if err != nil {
		log.Fatal("Elective basket list not retrieved from database")
	}
	err = studentHandler.RetrieveSubgroup()
	if err != nil {
		log.Fatal("Subgroup list not retrieved from database")
	}

	app := router.SetupRoutes()

	log.Fatal(app.Listen(PORT))
}
