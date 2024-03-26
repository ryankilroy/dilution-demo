BEGIN;

-- Default account to hold unassigned shares
INSERT INTO Account (id, owner) VALUES 
('78884002-eb09-11ee-8cd3-abd5884f74a2', '');

-- Initial stock transaction at company incorporation
INSERT INTO StockTransaction (account_id, number_of_shares) VALUES 
('78884002-eb09-11ee-8cd3-abd5884f74a2', 10000000);

-- Initial account statement for company incorporation
INSERT INTO AccountStatement (account_id, shares) VALUES 
('78884002-eb09-11ee-8cd3-abd5884f74a2', 10000000);

-- Creation of founders' accounts
INSERT INTO Account (id, owner) VALUES 
('bff0b644-eb0a-11ee-bb77-73f967eb29aa', 'Eren Jaeger'),
('cd9e15ca-eb0a-11ee-ba04-ffe03be79e25', 'Mikasa Ackerman'),
('db11ead8-eb0a-11ee-8ff1-c32024386972', 'Armin Arlert');

-- Initial stock transactions for founders
INSERT INTO StockTransaction (account_id, number_of_shares) VALUES 
('bff0b644-eb0a-11ee-bb77-73f967eb29aa', 400000),
('cd9e15ca-eb0a-11ee-ba04-ffe03be79e25', 300000),
('db11ead8-eb0a-11ee-8ff1-c32024386972', 100000);

-- Initial account statements for founders
INSERT INTO AccountStatement (account_id, shares, ownership_percent) VALUES 
('bff0b644-eb0a-11ee-bb77-73f967eb29aa', 400000, 44.4444),
('cd9e15ca-eb0a-11ee-ba04-ffe03be79e25', 300000, 33.3333),
('db11ead8-eb0a-11ee-8ff1-c32024386972', 100000, 11.1111);

COMMIT;