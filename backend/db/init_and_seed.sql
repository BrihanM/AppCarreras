-- Init and seed for StreetRaceX (PostgreSQL)
-- Creates core schema and inserts sample data for development.
-- Requires: PostgreSQL, extension pgcrypto for gen_random_uuid()

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Accounts (auth)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo TEXT,
  last_connection TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  local_zone VARCHAR(150),
  city_area VARCHAR(150),
  state_zone VARCHAR(150),
  country_zone VARCHAR(150),
  rank VARCHAR(8),
  category_id UUID,
  victories INT DEFAULT 0,
  defeats INT DEFAULT 0,
  consecutive_challenges INT DEFAULT 0,
  state VARCHAR(20),
  account_id UUID UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_by UUID NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoked_reason TEXT NULL,
  ip VARCHAR(100) NULL,
  user_agent TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Competition categories
CREATE TABLE IF NOT EXISTS competition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  plate VARCHAR(50) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id),
  challenged_id UUID REFERENCES users(id),
  career_type VARCHAR(50),
  challenger_vehicle_id UUID REFERENCES vehicles(id),
  challenged_vehicle_id UUID REFERENCES vehicles(id),
  state VARCHAR(20),
  winner_id UUID REFERENCES users(id),
  agreed_location VARCHAR(255),
  agreed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id UUID REFERENCES challenges(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Seed data (development)
-- Fixed UUIDs for reproducible relations

-- Accounts
INSERT INTO accounts (id, username, email, password_hash, photo) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@streeracex.test', 'pbkdf2:samplehash', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO accounts (id, username, email, password_hash) VALUES
  ('22222222-2222-2222-2222-222222222222', 'pilot_one', 'pilot1@streeracex.test', 'pbkdf2:samplehash', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO accounts (id, username, email, password_hash) VALUES
  ('33333333-3333-3333-3333-333333333333', 'pilot_two', 'pilot2@streeracex.test', 'pbkdf2:samplehash', NULL)
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO competition_categories (id, name, description, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Street', 'Lightweight street class', TRUE),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pro', 'High performance professional class', TRUE)
ON CONFLICT DO NOTHING;

-- Users
INSERT INTO users (id, name, city_area, country_zone, rank, category_id, victories, defeats, consecutive_challenges, state, account_id) VALUES
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Admin Driver', 'Downtown', 'ES', 'A', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 5, 2, 'active', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Pilot One', 'North Side', 'ES', 'B', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 12, 4, 0, 'active', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-3333-3333-3333-cccccccccccc', 'Pilot Two', 'South Side', 'ES', 'B', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 8, 7, 1, 'active', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Vehicles
INSERT INTO vehicles (id, user_id, make, model, plate, active) VALUES
  ('41111111-1111-1111-1111-411111111111', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'Nissan', 'Skyline R34', 'SRX-001', TRUE),
  ('42222222-2222-2222-2222-422222222222', 'cccccccc-3333-3333-3333-cccccccccccc', 'Toyota', 'Supra MK4', 'SRX-002', TRUE)
ON CONFLICT DO NOTHING;

-- Challenges
INSERT INTO challenges (id, challenger_id, challenged_id, career_type, challenger_vehicle_id, challenged_vehicle_id, state, agreed_location, agreed_date, notes) VALUES
  ('51111111-1111-1111-1111-511111111111', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'cccccccc-3333-3333-3333-cccccccccccc', 'street', '41111111-1111-1111-1111-411111111111', '42222222-2222-2222-2222-422222222222', 'pending', 'Old Bridge', NULL, 'First demo challenge')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (id, user_id, type, message, is_read, reference_id) VALUES
  ('61111111-1111-1111-1111-611111111111', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'challenge', 'Has recibido un reto', FALSE, '51111111-1111-1111-1111-511111111111')
ON CONFLICT DO NOTHING;

-- Example refresh token (hashed token string placeholder)
INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES
  ('71111111-1111-1111-1111-711111111111', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'hashed-refresh-token-placeholder', now() + interval '30 days')
ON CONFLICT DO NOTHING;

-- Done

COMMENT ON TABLE accounts IS 'Accounts for authentication (username/email/password_hash)';
COMMENT ON TABLE users IS 'User profile and racing stats';
COMMENT ON TABLE competition_categories IS 'Categories/classes for competitions';
COMMENT ON TABLE vehicles IS 'User vehicles registered in the system';
COMMENT ON TABLE challenges IS 'Challenges between pilots';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE refresh_tokens IS 'Refresh tokens issued for sessions';
