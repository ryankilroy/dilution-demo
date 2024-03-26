package repository

import (
	models "dilution-demo/db/models"
)

func GetAccount(owner string) (*models.Account, error) {
	// Use db.GetDB() to get a reference to your database
	// Write your SQL query and execute it
	// Scan the result into an Account object and return it
}