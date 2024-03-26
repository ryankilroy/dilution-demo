package db

type Account struct {
		ID									string							`db:"id"`
		Owner								string							`db:"owner"` // Empty string is reserved for an account representing the unassigned shares
		StockTransactions		[]StockTransaction
		AccountStatements		[]AccountStatement
}