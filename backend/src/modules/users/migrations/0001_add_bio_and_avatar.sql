-- Migration: add bio and avatar_url to users if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- Optional: backfill avatar_url from accounts.photo when account relation exists
-- UPDATE users u SET avatar_url = a.photo FROM accounts a WHERE u.account_id = a.id AND (u.avatar_url IS NULL OR u.avatar_url = '');
