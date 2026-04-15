package model

type Finance struct {
	Name     string `json:"finance_name" bson:"finance_name"`
	Email    string `json:"finance_email" bson:"finance_email"`
	Password string `json:"finance_password" bson:"finance_password"`
}
