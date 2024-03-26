package db

import (
	"database/sql"
	"time"
)

type StockTransactionType string

const (
	Create	StockTransactionType = "CREATE"
	Issue		StockTransactionType = "ISSUE"
	Grant		StockTransactionType = "GRANT"
	Vest		StockTransactionType = "VEST"
)

type StockTransaction struct {
	ID										int64										`db:"id"`
	AccountID							int64										`db:"account_id"`
	Type									StockTransactionType		`db:"type"`
	Date									time.Time								`db:"date"`
	GrantDate							time.Time								`db:"grant_date"`
	VestingDate						sql.NullTime						`db:"vesting_date"`
	ExpirationDate				sql.NullTime						`db:"expiration_date"`
	NumberOfShares				int											`db:"number_of_shares"`
}