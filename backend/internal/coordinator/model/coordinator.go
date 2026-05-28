package model

type Coordinator struct {
	Name        string `json:"name" bson:"name"`
	Email       string `json:"email" bson:"email"`
	Password    string `json:"password" bson:"password"`
	Department  string `json:"department" bson:"department"`
	Designation string `json:"designation" bson:"designation"`
	TenureStart string `json:"tenureStart" bson:"tenureStart"`
	TenureEnd   string `json:"tenureEnd" bson:"tenureEnd"`
}

type PasswordUpdation struct {
	Email       string `json:"email" bson:"email"`
	OldPassword string `json:"old_password" bson:"old_password"`
	NewPassword string `json:"new_password" bson:"new_password"`
}
