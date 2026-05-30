-- Migration: add last_ip and last_user_agent to accounts for monitoring
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS last_ip VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_user_agent TEXT;

-- optional: backfill last_ip for existing refresh_tokens where possible
UPDATE accounts a
SET last_ip = rt.ip, last_user_agent = rt.user_agent
FROM refresh_tokens rt
WHERE a.id = rt.user_id
AND a.last_ip IS NULL
AND rt.created_at = (
  SELECT MAX(created_at) FROM refresh_tokens WHERE user_id = rt.user_id
);
