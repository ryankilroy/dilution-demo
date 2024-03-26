BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE Account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner TEXT
);

CREATE TABLE StockTransaction (
    id SERIAL PRIMARY KEY,
    account_id UUID REFERENCES Account(id),
    type TEXT,
    date TIMESTAMP,
    grant_date TIMESTAMP,
    vesting_date TIMESTAMP,
    expiration_date TIMESTAMP,
    number_of_shares INT
);

CREATE TABLE AccountStatement (
    id SERIAL PRIMARY KEY,
    account_id UUID REFERENCES Account(id),
		shares INT,
		vested_options INT,
		unvested_options INT,
		ownership_percent DECIMAL(6,4)
);

COMMIT;