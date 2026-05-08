-- Migration: create accounts and users tables (module-local copy)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo TEXT,
  last_connection TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  local_zone VARCHAR(150),
  city_area VARCHAR(150),
  state_zone VARCHAR(150),
  country_zone VARCHAR(150),
  rank VARCHAR(2),
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
