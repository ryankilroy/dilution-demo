package repository

import (
	"database/sql"
	"dilution-demo/db"
	models "dilution-demo/db/models"
	"fmt"
)

func GetAccount(owner string, selectedFields []string) (*models.Account, error) {
	accounts, err := GetAccounts(owner, selectedFields)
	return accounts[0], err
}

func GetAccounts(owner string, selectedFields []string) ([]*models.Account, error) {
	db := db.GetDB()
	paramaterizedQuery := "SELECT * FROM accounts"
	if owner != "" {
		paramaterizedQuery += " WHERE owner = $1"
	}

	shouldJoinStockTransactions := false
	shouldJoinAccountStatements := false
	for _, field := range selectedFields {
		fmt.Println("field: ", field)
		if field == "stock_transactions" {
			shouldJoinStockTransactions = true
			fmt.Println("shouldJoinStockTransactions: ", shouldJoinStockTransactions)
		} else if field == "account_statements" {
			shouldJoinAccountStatements = true
			fmt.Println("shouldJoinAccountStatements: ", shouldJoinAccountStatements)
		}
	}

	rows := &sql.Rows{}
	err := error(nil)
	if owner != "" {
		rows, err = db.Query(paramaterizedQuery, owner)
	} else {
		rows, err = db.Query(paramaterizedQuery)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	accounts := []*models.Account{}

	for rows.Next() {
		account := &models.Account{}
		accountFieldsToScan := []interface{}{&account.UUID, &account.Owner}
		err := rows.Scan(accountFieldsToScan...)
		if err != nil {
			return nil, err
		}

		if shouldJoinStockTransactions {
			stockTransactions, err := GetStockTransactions(account.UUID)
			if err != nil {
				return nil, err
			}
			account.StockTransactions = stockTransactions
		}
		fmt.Println("account: ", account)

		if shouldJoinAccountStatements {
			accountStatements, err := GetAccountStatements(account.UUID)
			if err != nil {
				return nil, err
			}
			account.AccountStatements = accountStatements
		}

		accounts = append(accounts, account)
	}

	return accounts, nil
}

func GetStockTransactions(accountUUID string) ([]models.StockTransaction, error) {
	db := db.GetDB()
	paramaterizedQuery := "SELECT * FROM stock_transactions WHERE account_uuid = $1"
	rows, err := db.Query(paramaterizedQuery, accountUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stockTransactions := []models.StockTransaction{}
	for rows.Next() {
		stockTransaction := models.StockTransaction{}
		err := rows.Scan(&stockTransaction.ID,
			&stockTransaction.AccountUUID,
			&stockTransaction.Shares,
			&stockTransaction.Type,
			&stockTransaction.Date,
			&stockTransaction.GrantDate,
			&stockTransaction.VestingDate,
			&stockTransaction.ExpirationDate,
			&stockTransaction.StrikePrice)
		if err != nil {
			return nil, err
		}
		stockTransactions = append(stockTransactions, stockTransaction)
	}

	return stockTransactions, nil
}

func GetAccountStatements(accountUUID string) ([]models.AccountStatement, error) {
	db := db.GetDB()
	paramaterizedQuery := "SELECT * FROM account_statements WHERE account_uuid = $1"
	rows, err := db.Query(paramaterizedQuery, accountUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accountStatements := []models.AccountStatement{}
	for rows.Next() {
		accountStatement := models.AccountStatement{}
		err := rows.Scan(&accountStatement.ID, 
			&accountStatement.AccountUUID, 
			&accountStatement.Date, 
			&accountStatement.Shares, 
			&accountStatement.VestedOptions, 
			&accountStatement.UnvestedOptions)
		if err != nil {
			return nil, err
		}
		accountStatements = append(accountStatements, accountStatement)
	}

	return accountStatements, nil
}