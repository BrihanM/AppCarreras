CREATE TABLE IF NOT EXISTS race_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(140) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'Medellin',
  country VARCHAR(120) NOT NULL DEFAULT 'Colombia',
  agreed_location VARCHAR(255) NOT NULL,
  competition_category_id UUID NULL REFERENCES competition_categories(id) ON DELETE SET NULL,
  origin_lat NUMERIC(10,7) NOT NULL,
  origin_lng NUMERIC(10,7) NOT NULL,
  destination_lat NUMERIC(10,7) NOT NULL,
  destination_lng NUMERIC(10,7) NOT NULL,
  route_geometry JSONB,
  provider VARCHAR(50) NOT NULL DEFAULT 'db_catalog',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_race_tracks_name_city_country
  ON race_tracks (LOWER(name), LOWER(city), LOWER(country));

CREATE INDEX IF NOT EXISTS idx_race_tracks_active_city
  ON race_tracks (is_active, city);

INSERT INTO race_tracks (
  name,
  city,
  country,
  agreed_location,
  competition_category_id,
  origin_lat,
  origin_lng,
  destination_lat,
  destination_lng,
  route_geometry,
  provider,
  is_active
)
VALUES
  (
    'Pista Las Palmas Sprint',
    'Medellin',
    'Colombia',
    'Avenida Las Palmas - Tramo Alto de Las Palmas',
    (SELECT id FROM competition_categories WHERE LOWER(name) = 'street' LIMIT 1),
    6.2033250,
    -75.5429970,
    6.1876960,
    -75.5457120,
    '{"type":"LineString","coordinates":[[-75.542997,6.203325],[-75.544610,6.198824],[-75.545712,6.187696]]}'::jsonb,
    'db_catalog',
    TRUE
  ),
  (
    'Pista Avenida Regional Norte',
    'Medellin',
    'Colombia',
    'Avenida Regional - Tramo Caribe a Industriales',
    (SELECT id FROM competition_categories WHERE LOWER(name) = 'pro street' LIMIT 1),
    6.2791320,
    -75.5690300,
    6.2301210,
    -75.5761120,
    '{"type":"LineString","coordinates":[[-75.56903,6.279132],[-75.571942,6.262880],[-75.576112,6.230121]]}'::jsonb,
    'db_catalog',
    TRUE
  ),
  (
    'Pista Autopista Sur Drag',
    'Medellin',
    'Colombia',
    'Autopista Sur - Tramo La Estrella a Itagui',
    (SELECT id FROM competition_categories WHERE LOWER(name) = 'drag' LIMIT 1),
    6.1574310,
    -75.6224040,
    6.1689100,
    -75.6200150,
    '{"type":"LineString","coordinates":[[-75.622404,6.157431],[-75.621180,6.163903],[-75.620015,6.16891]]}'::jsonb,
    'db_catalog',
    TRUE
  ),
  (
    'Pista Circular El Poblado',
    'Medellin',
    'Colombia',
    'Circuito El Poblado - Milla de Oro',
    (SELECT id FROM competition_categories WHERE LOWER(name) = 'time attack' LIMIT 1),
    6.2093300,
    -75.5656700,
    6.2061200,
    -75.5729400,
    '{"type":"LineString","coordinates":[[-75.56567,6.20933],[-75.568112,6.211881],[-75.57294,6.20612]]}'::jsonb,
    'db_catalog',
    TRUE
  ),
  (
    'Pista Mirador San Felix Climb',
    'Medellin',
    'Colombia',
    'Via San Felix - Tramo ascenso rural',
    (SELECT id FROM competition_categories WHERE LOWER(name) = 'rally' LIMIT 1),
    6.3637810,
    -75.6281440,
    6.3854120,
    -75.6420220,
    '{"type":"LineString","coordinates":[[-75.628144,6.363781],[-75.635505,6.372255],[-75.642022,6.385412]]}'::jsonb,
    'db_catalog',
    TRUE
  )
ON CONFLICT DO NOTHING;
