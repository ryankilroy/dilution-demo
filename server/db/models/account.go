package main

import (
	"database/sql"
)

type Account struct {
		ID									int64								`db:"id"`
		Owner								sql.NullString			`db:"owner"`
		StockTransactions		[]StockTransaction
		AccountStatements		[]AccountStatement
}