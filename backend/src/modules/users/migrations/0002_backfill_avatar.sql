-- Backfill users.avatar_url from accounts.photo when empty
UPDATE users u
SET avatar_url = a.photo
FROM accounts a
WHERE u.account_id = a.id
  AND (u.avatar_url IS NULL OR u.avatar_url = '');
