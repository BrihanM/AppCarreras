-- Migration: create users table for users microservice
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
  updated_at TIMESTAMP DEFAULT NOW()
);
