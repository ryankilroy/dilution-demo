BEGIN;

DROP TABLE IF EXISTS AccountStatement;
DROP TABLE IF EXISTS StockTransaction;
DROP TABLE IF EXISTS Account;

DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;