package db

import (
	"time"
)

type AccountStatement struct {
	ID								int64					`db:"id"`
	AccountUUID				string				`db:"account_uuid"`
	Date							time.Time			`db:"date"`
	Shares						int32					`db:"shares"`
	VestedOptions			int32					`db:"vested_options"`
	UnvestedOptions		int32					`db:"unvested_options"`
	// HIGHLY unlikely any single account will have more than 2.1 billion shares
	// or options given that is about the entirety of Berkshire Hathaway's shares
}