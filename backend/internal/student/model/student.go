package model

type Student struct {
	Name               string   `json:"name" bson:"name"`
	RollNo             string   `json:"roll_no" bson:"roll_no"`
	AcademicYear       string   `json:"academic_year" bson:"academic_year"`
	Branch             string   `json:"branch" bson:"branch"`
	Subgroup           string   `json:"subgroup" bson:"subgroup"`
	ThaparEmail        string   `json:"thapar_email" bson:"thapar_email"`
	ElectiveBasket     string   `json:"elective_basket" bson:"elective_basket"`
	GeneralElective    string   `json:"general_elective" bson:"general_elective"`
	PhoneNumber        string   `json:"phone_number" bson:"phone_number"`
	Password           string   `json:"password" bson:"password"`
	Verified           bool     `json:"verified" bson:"verified"`
	Applications       []string `json:"applications" bson:"applications"`
	OngoingApplication string   `json:"ongoing_application" bson:"ongoing_application"`
	Department         string   `json:"department" bson:"department"`
	ElectiveData       []string `json:"electiveData" bson:"electiveData"` // ← ADDED
}

type ElectiveBasket struct {
	Data []string `json:"data" bson:"data"`
}

type Subgroup struct {
	Data []string `json:"data" bson:"data"`
}

type ApplicationRequest struct {
	Email            string           `json:"email" bson:"email"`
	OptedCourses     [][]string       `json:"opted_courses" bson:"opted_courses"`
	Message          string           `json:"message" bson:"message"`
	Clashing         bool             `json:"clashing" bson:"clashing"`
	NewTimeTable     []TimeTableEntry `json:"new_time_table" bson:"new_time_table"`
	CurrentTimeTable []TimeTableEntry `json:"current_time_table" bson:"current_time_table"` // ← ADD
	ElectiveData     []string         `json:"elective_data" bson:"elective_data"`
	CGPA             string           `json:"cgpa" bson:"cgpa"`
}

type TimeTableEntry struct {
	Color       string `json:"color" bson:"color"`
	Day         string `json:"day" bson:"day"`
	Hour        string `json:"hour" bson:"hour"`
	SubjectCode string `json:"subjectCode" bson:"subjectCode"`
	SubjectName string `json:"subjectName" bson:"subjectName"`
	Venue       string `json:"venue" bson:"venue"`
	Clash       bool   `json:"clash" bson:"clash"` // ← ADDED
}

type Application struct {
	ApplicationId    string           `json:"application_id" bson:"application_id"`
	Email            string           `json:"email" bson:"email"`
	RollNo           string           `json:"roll_no" bson:"roll_no"`
	Name             string           `json:"name" bson:"name"`
	Branch           string           `json:"branch" bson:"branch"`
	AcademicYear     string           `json:"year" bson:"year"`
	PhoneNumber      string           `json:"phone_number" bson:"phone_number"`
	Department       string           `json:"department" bson:"department"`
	Subgroup         string           `json:"subgroup" bson:"subgroup"`
	ElectiveBasket   string           `json:"elective_basket" bson:"elective_basket"`
	GeneralElective  string           `json:"general_elective" bson:"general_elective"`
	OptedCourses     [][]string       `json:"opted_courses" bson:"opted_courses"`
	Clashing         bool             `json:"clashing" bson:"clashing"`
	Comments         []string         `json:"comments" bson:"comments"`
	Message          string           `json:"message" bson:"message"`
	Stage            int              `json:"stage" bson:"stage"`
	URL              string           `json:"url" bson:"url"`
	FeeReceiptLink   string           `json:"fee_receipt_link" bson:"fee_receipt_link"`
	NewTimeTable     []TimeTableEntry `json:"new_time_table" bson:"new_time_table"`
	CurrentTimeTable []TimeTableEntry `json:"current_time_table" bson:"current_time_table"` // ← ADD
	ElectiveData     []string         `json:"elective_data" bson:"elective_data"`
	CGPA             string           `json:"cgpa" bson:"cgpa"`
}

type ApplicationList struct {
	Applications []Application `json:"applications" bson:"applications"`
}
