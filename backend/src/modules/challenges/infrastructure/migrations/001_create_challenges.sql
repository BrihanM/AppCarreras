
-- Migration: create challenges table (schema provided by user)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY,
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
