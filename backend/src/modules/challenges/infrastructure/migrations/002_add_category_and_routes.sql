-- Adds competition category linkage and persistent route coordinates/geometry for challenges.
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS competition_category_id UUID REFERENCES competition_categories(id);

CREATE INDEX IF NOT EXISTS idx_challenges_competition_category_id
  ON challenges(competition_category_id);

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