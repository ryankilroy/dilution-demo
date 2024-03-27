package db

import (
	"database/sql"
	"time"
)

type StockTransactionType string

const (
	Create		StockTransactionType = "CREATE"
	Issue			StockTransactionType = "ISSUE"
	Grant			StockTransactionType = "GRANT"
	Vest			StockTransactionType = "VEST"
	Exercise	StockTransactionType = "EXERCISE"
	Expire		StockTransactionType = "EXPIRE"
)

type StockTransaction struct {
	ID										int64										`db:"id"`
	AccountUUID						string									`db:"account_uuid"`
	Date									time.Time								`db:"date"`
	Type									StockTransactionType		`db:"type"`
	GrantDate							time.Time								`db:"grant_date"`
	VestingDate						sql.NullTime						`db:"vesting_date"`
	ExpirationDate				sql.NullTime						`db:"expiration_date"`
	StrikePrice						float64									`db:"strike_price"`
	Shares								int32										`db:"shares"`
	// TODO: Handle bankrupcy or dissolution of company
	// int32 theoretically runs into issues if all the company's shares are dissolved
	// additionally, it does not handle fractional shares
}