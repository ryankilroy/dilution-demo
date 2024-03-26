package repository

import (
	"dilution-demo/db"
	models "dilution-demo/db/models"
	"errors"
)

func GetAccount(owner string) (*models.Account, error) {
	db := db.GetDB()
	rows, err := db.Query("SELECT * FROM account WHERE owner = $1", owner)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	account := &models.Account{}
	if rows.Next() {
		err := rows.Scan(&account.ID, &account.Owner)
		if err != nil {
			return nil, err
		}
	}

	// Return an error if there is another row
	if rows.Next() {
		return nil, errors.New("more than one row returned")
	}

	return account, nil
}