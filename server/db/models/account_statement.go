package db

import (
	"time"
)

type AccountStatement struct {
		ID								int64				`db:"id"`
		Date							time.Time		`db:"date"`
		AccountID					int64				`db:"account_id"`
		Shares						int					`db:"shares"`
		VestedOptions			int					`db:"vested_options"`
		UnvestedOptions		int					`db:"unvested_options"`
		OwnershipPercent	float64			`db:"ownership_percent"`
}