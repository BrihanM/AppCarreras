-- Migration: create invalidation_rules table
CREATE TABLE IF NOT EXISTS invalidation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  mutating_endpoint TEXT NOT NULL,
  invalidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invalidation_rules_mutating ON invalidation_rules(mutating_endpoint);
