-- Vehicle catalog with self-reference: brands and models in one table.
-- type = 'brand' has parent_id NULL
-- type = 'model' references a brand row in parent_id

CREATE TABLE IF NOT EXISTS vehicle_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('brand', 'model')),
  parent_id UUID NULL REFERENCES vehicle_catalog(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT vehicle_catalog_parent_rule CHECK (
    (type = 'brand' AND parent_id IS NULL) OR
    (type = 'model' AND parent_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_vehicle_catalog_brand_name
  ON vehicle_catalog (LOWER(name))
  WHERE type = 'brand';

CREATE UNIQUE INDEX IF NOT EXISTS ux_vehicle_catalog_model_name_per_brand
  ON vehicle_catalog (parent_id, LOWER(name))
  WHERE type = 'model';

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS brand_catalog_id UUID NULL REFERENCES vehicle_catalog(id),
  ADD COLUMN IF NOT EXISTS model_catalog_id UUID NULL REFERENCES vehicle_catalog(id);

-- Seed brands (idempotent)
INSERT INTO vehicle_catalog (name, type, parent_id, is_active)
SELECT b.name, 'brand', NULL, TRUE
FROM (VALUES ('Nissan'), ('Toyota'), ('Mazda'), ('Ford'), ('Honda'), ('BMW'), ('Audi')) AS b(name)
ON CONFLICT DO NOTHING;

-- Seed models for each brand (idempotent)
INSERT INTO vehicle_catalog (name, type, parent_id, is_active)
SELECT m.model_name, 'model', b.id, TRUE
FROM (
  VALUES
    ('Nissan', 'Skyline R34'), ('Nissan', '370Z'),
    ('Toyota', 'Supra MK4'), ('Toyota', 'GT86'),
    ('Mazda', 'RX-7'), ('Mazda', 'MX-5'),
    ('Ford', 'Mustang GT'), ('Ford', 'Focus RS'),
    ('Honda', 'Civic Type R'), ('Honda', 'S2000'),
    ('BMW', 'M3'), ('BMW', 'M2'),
    ('Audi', 'RS3'), ('Audi', 'TT RS')
) AS m(brand_name, model_name)
JOIN vehicle_catalog b ON b.type = 'brand' AND LOWER(b.name) = LOWER(m.brand_name)
ON CONFLICT DO NOTHING;

-- Backfill existing vehicles with references
UPDATE vehicles v
SET brand_catalog_id = b.id
FROM vehicle_catalog b
WHERE b.type = 'brand'
  AND LOWER(b.name) = LOWER(v.make)
  AND v.brand_catalog_id IS NULL;

UPDATE vehicles v
SET model_catalog_id = m.id
FROM vehicle_catalog m
WHERE m.type = 'model'
  AND m.parent_id = v.brand_catalog_id
  AND LOWER(m.name) = LOWER(v.model)
  AND v.model_catalog_id IS NULL;
