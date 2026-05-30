
-- Migration: create challenges table (schema provided by user)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY,
  challenger_id UUID REFERENCES users(id),
  challenged_id UUID REFERENCES users(id),
  competition_category_id UUID REFERENCES competition_categories(id),
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
CREATE INDEX IF NOT EXISTS idx_challenges_competition_category_id ON challenges(competition_category_id);

CREATE TABLE IF NOT EXISTS challenge_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL UNIQUE REFERENCES challenges(id) ON DELETE CASCADE,
  origin_lat NUMERIC(10,7) NOT NULL,
  origin_lng NUMERIC(10,7) NOT NULL,
  destination_lat NUMERIC(10,7) NOT NULL,
  destination_lng NUMERIC(10,7) NOT NULL,
  route_geometry JSONB,
  provider VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_routes_challenge_id ON challenge_routes(challenge_id);
