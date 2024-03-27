package db

type CompanyCapitalizationSnapshot struct {
	StockTransactionID		int64				`db:"stock_transaction_id"`
	UnissuedShares				int64				`db:"unissued_shares"`
	OutstandingShares			int64				`db:"outstanding_shares"`
	UnvestedOptions				int64				`db:"unvested_options"`
}