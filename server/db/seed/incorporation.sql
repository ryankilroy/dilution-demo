BEGIN;

-- Initial stock transaction at company incorporation
INSERT INTO stock_transactions (id, type, shares, date)
VALUES (1, 'CREATE', 10000000, '2024-01-01');

-- Initial account statement for company incorporation
INSERT INTO company_capitalization (stock_transaction_id, unissued_shares)
VALUES (1, 10000000);

-- Creation of founders' accounts
INSERT INTO accounts (uuid, owner) VALUES
('bff0b644-eb0a-11ee-bb77-73f967eb29aa', 'Eren Jaeger'),
('cd9e15ca-eb0a-11ee-ba04-ffe03be79e25', 'Mikasa Ackerman'),
('db11ead8-eb0a-11ee-8ff1-c32024386972', 'Armin Arlert');

-- Initial stock transactions for founders
INSERT INTO stock_transactions (id, account_uuid, type, shares, date) VALUES
(2, 'bff0b644-eb0a-11ee-bb77-73f967eb29aa', 'ISSUE', 4000000, '2024-01-01'),
(3, 'cd9e15ca-eb0a-11ee-ba04-ffe03be79e25', 'ISSUE', 3000000, '2024-02-02'),
(4, 'db11ead8-eb0a-11ee-8ff1-c32024386972', 'ISSUE', 1000000, '2024-03-03');

INSERT INTO company_capitalization (stock_transaction_id, outstanding_shares, unissued_shares) VALUES
(2, 4000000, 6000000),
(3, 3000000, 3000000),
(4, 1000000, 2000000); 

-- Initial account statements for founders
INSERT INTO account_statements (account_uuid, shares, date) VALUES
('bff0b644-eb0a-11ee-bb77-73f967eb29aa', 4000000, '2024-01-01'),
('cd9e15ca-eb0a-11ee-ba04-ffe03be79e25', 3000000, '2024-02-02'),
('db11ead8-eb0a-11ee-8ff1-c32024386972', 1000000, '2024-03-03');

COMMIT;