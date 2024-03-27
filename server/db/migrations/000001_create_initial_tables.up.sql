BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE Accounts (
	uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	owner TEXT
);

CREATE TABLE StockTransactions (
	id BIGSERIAL PRIMARY KEY,
	account_uuid UUID REFERENCES Accounts(uuid),
	type TEXT,
	date TIMESTAMP,
	grant_date TIMESTAMP,
	vesting_date TIMESTAMP,
	expiration_date TIMESTAMP,
	shares INT
);

CREATE TABLE CompanyCapitalization (
	stock_transaction_id BIGINT PRIMARY KEY REFERENCES StockTransactions(id),
	unissued_shares BIGINT,
	outstanding_shares BIGINT,
	unvested_options BIGINT
);

CREATE TABLE AccountStatements (
	id BIGSERIAL PRIMARY KEY,
	account_uuid UUID REFERENCES Accounts(uuid),
	date TIMESTAMP,
	shares INT,
	vested_options INT,
	unvested_options INT
);

COMMIT;