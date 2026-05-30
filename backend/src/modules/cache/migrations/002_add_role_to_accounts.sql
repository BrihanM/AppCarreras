-- Migration: add role column to accounts and set seed admin
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Ensure existing admin account has role 'admin'
UPDATE accounts SET role='admin' WHERE username='admin';

CREATE INDEX IF NOT EXISTS idx_accounts_role ON accounts(role);
