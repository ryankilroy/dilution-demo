BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE accounts (
	uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	owner TEXT
);

CREATE TABLE stock_transactions (
	id BIGSERIAL PRIMARY KEY,
	account_uuid UUID REFERENCES accounts(uuid),
	shares INT,
	type TEXT,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	grant_date TIMESTAMP DEFAULT NULL,
	vesting_date TIMESTAMP DEFAULT NULL,
	expiration_date TIMESTAMP DEFAULT NULL,
	strike_price DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE company_capitalization (
	stock_transaction_id BIGINT PRIMARY KEY REFERENCES stock_transactions(id),
	unissued_shares BIGINT DEFAULT 0,
	outstanding_shares BIGINT DEFAULT 0,
	unvested_options BIGINT DEFAULT 0
);

CREATE TABLE account_statements (
	id BIGSERIAL PRIMARY KEY,
	account_uuid UUID REFERENCES accounts(uuid),
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	shares INT DEFAULT 0,
	vested_options INT DEFAULT 0,
	unvested_options INT DEFAULT 0
);

COMMIT;