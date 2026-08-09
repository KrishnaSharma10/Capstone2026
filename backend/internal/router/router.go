package router

import (
	"strings"

	authHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/auth/handler"
	coordinatorHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/coordinator/handler"
	doaaHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/doaa/handler"
	financeHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/finance/handler"
	hodHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/hod/handler"
	studentHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/student/handler"
	utilsHandler "github.com/KrishnaSharma10/Capstone2026/backend/internal/utils/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func SetupRoutes() *fiber.App {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			return origin == "http://localhost:3000" ||
				origin == "https://capstone-react-frontend.onrender.com" ||
				strings.HasSuffix(origin, ".vercel.app")
		},
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	api := app.Group("/api")

	// student routes
	student := api.Group("/student")
	student.Post("/register", studentHandler.RegisterStudent)
	student.Post("/login", studentHandler.LoginStudent)
	student.Get("/gettimetable", studentHandler.GenerateTimeTable)
	student.Get("/get-elective-basket-list", studentHandler.GetElectiveBasket)
	student.Get("/get-subgroup-name-list", studentHandler.GetSubgroup)
	student.Post("/upload-fee", authHandler.JWTMiddleware, studentHandler.UploadFeeReciept)
	student.Post("/update-details", authHandler.JWTMiddleware, studentHandler.UpdateDetails)
	student.Get("/get-elective-data", studentHandler.GetElectiveData)
	student.Post("/generate-application", authHandler.JWTMiddleware, studentHandler.CreateApplication)
	student.Post("/get-all-application", studentHandler.GetAllApplicationsByEmail)
	//angad announcements
	student.Get("/get-notifications", studentHandler.GetNotifications)
	// hod routes
	hod := api.Group("/hod")
	hod.Post("/login", hodHandler.LoginHod)
	hod.Post("/create-coordinator", authHandler.JWTMiddleware, hodHandler.CreateCoordinator)
	hod.Post("/update-name", hodHandler.UpdateHodName)
	hod.Post("/update-password", hodHandler.UpdateHodPassword)
	hod.Get("/all-coordinators-details", authHandler.JWTMiddleware, hodHandler.GetAllCoordinatorsDetails)
	hod.Post("/delete-coordinator", authHandler.JWTMiddleware, hodHandler.DeleteCoordinator)
	hod.Get("/get-applicationsforhod", authHandler.JWTMiddleware, hodHandler.GetApplicationsForHod)

	//coordinator routes
	coordinator := api.Group("/coordinator")
	coordinator.Post("/login", coordinatorHandler.LoginCoordinator)
	coordinator.Post("/update-password", coordinatorHandler.UpdateCoordinatorPassword)
	coordinator.Post("/update-application", coordinatorHandler.UpdateApplication)
	coordinator.Post("/update-all-applications", coordinatorHandler.UpdateAllApplication)
	coordinator.Post("/post-notification", utilsHandler.AddNotification)
	coordinator.Post("/get-applications", coordinatorHandler.GetApplicationsForCoordinator) // ← ADD THIS

	//doaa routes
	doaa := api.Group("/doaa")
	doaa.Post("/login", doaaHandler.LoginDoaa)
	doaa.Post("/update-name", doaaHandler.UpdateDoaaName)
	doaa.Post("/update-password", doaaHandler.UpdateDoaaPassword)
	doaa.Get("/all-coordinators-details", doaaHandler.GetAllCoordinatorsDetails)
	doaa.Post("/update-application", doaaHandler.UpdateApplication)
	// doaa.Get("/get-all-applications", doaaHandler.GetAllApplications)

	//finance routes
	finance := api.Group("/finance")
	finance.Post("/login", financeHandler.LoginFinance)
	finance.Get("/pending-applications", financeHandler.GetPendingFeeApplications)
	finance.Post("/update-application", financeHandler.UpdateApplication)
	finance.Post("/update-all-applications", financeHandler.UpdateAllApplications)

	//auth routes
	auth := app.Group("/verify")
	auth.Get("/", authHandler.VerifyStudent)

	//util routes
	api.Get("/get-course-list", utilsHandler.GetCourseList)
	api.Post("/get-application-details", utilsHandler.GetApplicationDetails)
	api.Post("reject-application", utilsHandler.RejectApplicationById)
	api.Post("/get-application-status", utilsHandler.GetApplicationStatusById)
	api.Get("/get-all-applications", utilsHandler.GetAllApplications)
	api.Get("/get-notification", utilsHandler.GetNotificationHandler)
	api.Post("/update-course", utilsHandler.UpdateCourse)
	return app
}
