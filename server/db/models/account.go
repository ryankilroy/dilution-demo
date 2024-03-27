package db

type Account struct {
	UUID									string						`db:"uuid"`
	Owner								string							`db:"owner"`
	StockTransactions		[]StockTransaction
	AccountStatements		[]AccountStatement
}