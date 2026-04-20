package service

import (
	"bytes"
	"fmt"
	"os"
	"time"

	"github.com/KrishnaSharma10/Capstone2026/backend/internal/student/model"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/student/repository"
	"github.com/KrishnaSharma10/Capstone2026/backend/internal/utils/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func CreateStudent(c *fiber.Ctx) error {
	student := new(model.Student)

	if err := c.BodyParser(student); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for student Signup"})
	}
	studentExist, err := repository.CheckStudentExistence(student.ThaparEmail)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Some error occured while checking the existence of student"})
	}

	if studentExist {
		return c.Status(400).JSON(fiber.Map{"error": "Student Already exist"})
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(student.Password), 10)
	student.Password = string(hash)

	// Send confirmation mail to the given email ***************************
	claims := jwt.MapClaims{
		"email": student.ThaparEmail,
		"exp":   time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_KEY := os.Getenv("JWT_KEY")
	tokenString, _ := token.SignedString([]byte(JWT_KEY))
	service.SendVerificationEmail(student.ThaparEmail, tokenString)

	err = repository.CreateStudentDB(student)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Student not signed up due to some internal problem"})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"message": "Student signed up successfully"})
}

func LoginStudent(c *fiber.Ctx) error {

	input := new(model.Student)
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON for student Login"})
	}

	//find student by email id
	student, err := repository.GetStudentByEmail(input.ThaparEmail)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(400).JSON(fiber.Map{"error": "Student doesnt exist by this email"})
		}
		return c.Status(400).JSON(fiber.Map{"error": "Some error occured while logging in"})
	}

	//compare password
	err = bcrypt.CompareHashAndPassword([]byte(student.Password), []byte(input.Password))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	//check if email is verified
	if !student.Verified {
		return c.Status(400).JSON(fiber.Map{"error": "Please verify your email first"})
	}

	//generate JWT
	claims := jwt.MapClaims{
		"email": student.ThaparEmail,
		"role":  "student",
		"exp":   time.Now().Add(time.Hour * 1).Unix(), // Token expires in 1 hour
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	JWT_KEY := os.Getenv("JWT_KEY")
	tokenString, err := token.SignedString([]byte(JWT_KEY))

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Could not create JWT token for student"})
	}

	return c.Status(202).JSON(fiber.Map{"token": tokenString, "studentData": student})
}

func GetTimeTable(c *fiber.Ctx) error {
	subgroup := c.Query("subgroup")
	fmt.Println(subgroup)
	timeTable, _ := repository.GetTimeTableData(subgroup)
	return c.JSON(timeTable)
}

func RetrieveElectiveBasket() ([]string, error) {
	electiveBasket, err := repository.ElectiveBasketFromDB()
	if err != nil {
		return nil, err
	}
	return electiveBasket.Data, nil
}

func RetrieveSubgroup() ([]string, error) {
	subgroupList, err := repository.SubgroupFromDB()
	if err != nil {
		return nil, err
	}
	return subgroupList.Data, nil
}

// NEED TO CHECK JWT, APPLICATION ID AND RANDOMIZE THE FILE NAME ***************
func UploadReceipt(c *fiber.Ctx) error {
	appID := c.FormValue("applicationID")
	fileHeader, err := c.FormFile("pdf")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "PDF file not received")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to open file")
	}
	defer file.Close()

	filename := "fees_receipt_" + uuid.New().String()
	// Upload to Cloudinary with random filename
	url, err := service.UploadToCloudinary2(file, filename)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Upload failed")
	}

	repository.UpdateFeesLinkById(appID, url)

	return c.JSON(fiber.Map{
		"applicationID": appID,
		"url":           url,
	})
}

func UpdateDetails(c *fiber.Ctx) error {
	fmt.Println("Helloooo")
	input := new(model.Student)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for student details update"})
	}
	studentExist, err := repository.CheckStudentExistence(input.ThaparEmail)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Some error occured while checking the existence of student"})
	}

	if studentExist == false {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Student does not exist"})
	}

	// hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	// input.Password = string(hash)

	err = repository.UpdateDetailsDB(input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"message": "Student details changedp successfully"})
}

func GetElectiveData(c *fiber.Ctx) error {
	data, err := repository.GetElectiveData()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err})
	}
	return c.Status(fiber.StatusAccepted).JSON(data)
}

func GenerateAndSaveApplication(d *model.Application) string {

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(190, 10, "Backlog/ Add and Drop Proforma", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 11)
	pdf.Ln(4)
	pdf.Cell(70, 8, "Student Name: "+d.Name)
	pdf.Cell(70, 8, "Roll. No.: "+d.RollNo)
	pdf.Cell(70, 8, "Date: "+time.Now().Format("02/01/2006"))
	pdf.Ln(8)
	pdf.Cell(70, 8, "Branch and Year: "+d.Branch+" "+d.AcademicYear)
	pdf.Cell(70, 8, "Group: "+d.Subgroup)
	pdf.Cell(70, 8, "Mobile No.: "+d.PhoneNumber)
	pdf.Ln(8)
	pdf.Cell(70, 8, "Present CGPA: "+d.CGPA)

	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 11)
	pdf.Cell(190, 6, "Preference wise detail of Backlog Courses:")
	pdf.Ln(8)

	headers := []string{"Course Code", "Course Title", "Lecture", "Tutorial", "Practical"}
	widths := []float64{30, 90, 20, 25, 25}
	pdf.SetFont("Arial", "B", 10)
	for i, h := range headers {
		pdf.CellFormat(widths[i], 8, h, "1", 0, "C", false, 0, "")
	}
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 10)
	fmt.Println(d.OptedCourses)

	// for _, course := range d.OptedCourses {
	// 	pdf.CellFormat(30, 8, course[0], "1", 0, "C", false, 0, "")
	// 	pdf.CellFormat(90, 8, course[1], "1", 0, "C", false, 0, "")
	// 	pdf.CellFormat(20, 8, course[2], "1", 0, "C", false, 0, "")
	// 	pdf.CellFormat(25, 8, course[2], "1", 0, "C", false, 0, "")
	// 	pdf.CellFormat(25, 8, course[2], "1", 0, "C", false, 0, "")
	// 	pdf.Ln(8)
	// }

	for _, course := range d.OptedCourses {
		pdf.CellFormat(30, 8, course[0], "1", 0, "C", false, 0, "")
		pdf.CellFormat(90, 8, course[0], "1", 0, "C", false, 0, "")
		pdf.CellFormat(20, 8, course[1], "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 8, course[1], "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 8, course[1], "1", 0, "C", false, 0, "")
		pdf.Ln(8)
	}

	pdf.Ln(5)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(190, 6, "Important Notes :", "", 1, "", false, 0, "")
	pdf.Ln(1)
	pdf.SetFont("Arial", "B", 10)
	pdf.MultiCell(0, 6, "If course code is changed in the revised course scheme, then mention new code. Group name to be filled in the L/T/P Group column should be as mentioned in the time table of the respective semester", "", "", false)
	pdf.Ln(4)

	pdf.CellFormat(190, 6, "Regular Courses to be dropped, if any, for taking up Backlog Courses:", "", 1, "", false, 0, "")
	pdf.Ln(1)
	pdf.CellFormat(60, 8, "Course Code", "1", 0, "C", false, 0, "")
	pdf.CellFormat(130, 8, "Course Title", "1", 0, "C", false, 0, "")
	pdf.Ln(8)
	pdf.CellFormat(60, 7, "", "1", 0, "C", false, 0, "")
	pdf.CellFormat(130, 7, "", "1", 0, "C", false, 0, "")
	pdf.Ln(7)
	pdf.CellFormat(60, 7, "", "1", 0, "C", false, 0, "")
	pdf.CellFormat(130, 7, "", "1", 0, "C", false, 0, "")
	pdf.Ln(15)

	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(190, 6, "I hereby certify that:", "", 1, "", false, 0, "")
	pdf.SetFont("Arial", "B", 10)
	pdf.MultiCell(0, 6, "1. Total credits of all the courses in the current semester (including both regular and backlog/added courses) do not exceed 30.0 cr.", "", "", false)
	pdf.Ln(1)
	pdf.MultiCell(0, 6, "2. I am not undergoing the training in an industry/any other institute for project semester.", "", "", false)
	pdf.Ln(1)
	pdf.MultiCell(0, 6, "3. I will maintain minimum 75% attendance in the course.", "", "", false)
	pdf.Ln(10)
	pdf.SetFont("Arial", "", 10)
	pdf.MultiCell(0, 6, "Student Signature:    ________________________________", "", "", false)

	pdf.Ln(20)
	pdf.SetFont("Arial", "B", 11)
	pdf.MultiCell(0, 6, "The students should submit (in hard copy) the backlog/Add and drop proforma duly completed and approved by respective time table coordinator to Mr. Rupinder Pal Singh in academic section.", "", "", false)
	pdf.Ln(15)
	pdf.SetFont("Arial", "B", 10)
	pdf.MultiCell(0, 6, "Time-Table Coordinator			         																									          									                             Time-Table Committee Chairman", "", "", false)
	// Generate PDF in memory buffer
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return ""
	}

	// Upload to Cloudinary
	filename := "student_application_" + uuid.New().String()
	uploadURL, err := service.UploadToCloudinary2(bytes.NewReader(buf.Bytes()), filename)
	if err != nil {
		return ""
	}

	return uploadURL
}

func CreateApplication(c *fiber.Ctx) error {
	input := new(model.ApplicationRequest)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for student application request"})
	}

	student, err := repository.GetStudentByEmail(input.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cannot get students details for student application request"})
	}

	utilitiesData, err := repository.GetUtilities()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cannot get utilities details for student application request"})
	}

	application := new(model.Application)

	if id, ok := utilitiesData["latest_application_id"].(int64); ok {
		application.ApplicationId = fmt.Sprintf("%d", id+1)
		utilitiesData["latest_application_id"] = id + 1

		err = repository.UpdateUtilities(utilitiesData)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cannot create application id for student application request"})
		}
	} else {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cannot get utilities application id for student application request"})
	}

	application.Email = student.ThaparEmail
	application.RollNo = student.RollNo
	application.Name = student.Name
	application.Branch = student.Branch
	application.AcademicYear = student.AcademicYear
	application.PhoneNumber = student.PhoneNumber
	application.Department = "CSED"
	application.Subgroup = student.Subgroup
	application.ElectiveBasket = student.ElectiveBasket
	application.GeneralElective = student.GeneralElective
	application.OptedCourses = input.OptedCourses
	application.Clashing = input.Clashing
	application.Message = input.Message
	application.Comments = []string{"", ""}
	application.CGPA = input.CGPA

	application.Stage = 1
	if !input.Clashing {
		application.Stage = 2
	}
	application.NewTimeTable = input.NewTimeTable
	application.ElectiveData = input.ElectiveData

	url := GenerateAndSaveApplication(application)
	application.URL = url

	student.OngoingApplication = application.ApplicationId
	err = repository.UpdateDetailsDB(&student)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update student's ongoing application"})
	}

	err = repository.CreateApplicationInDB(application)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Cannot generate application for student "})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"Status": "Student Application successfully created", "url": url, "applicationId": application.ApplicationId})
}

func GetAllApplicationsByEmail(c *fiber.Ctx) error {
	input := new(model.Student)

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON for student application history request"})
	}

	if input.ThaparEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot get student email to get all his applications "})
	}

	allApplications, err := repository.AllApplicationsByEmailInDB(input.ThaparEmail)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot get all application for student "})
	}
	return c.Status(200).JSON(fiber.Map{"Applications": allApplications})
}

// angad announcements
func GetNotifications(c *fiber.Ctx) error {
	notifications, err := repository.GetNotificationsFromDB()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch notifications"})
	}
	return c.Status(fiber.StatusOK).JSON(notifications)
}
