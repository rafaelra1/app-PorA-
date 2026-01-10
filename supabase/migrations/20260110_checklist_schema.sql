-- Migration: Smart Checklist MVP
-- Creates table for trip checklist items with rule-based generation support

CREATE TABLE IF NOT EXISTS trip_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Rule tracking (NULL for manual tasks)
  rule_id TEXT,
  
  -- Task details
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('documentation', 'health', 'reservations', 'packing', 'financial', 'tech')),
  priority TEXT NOT NULL CHECK (priority IN ('blocking', 'important', 'recommended')),
  
  -- Completion tracking
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Deadline
  due_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast trip lookups
CREATE INDEX IF NOT EXISTS idx_checklist_trip_id ON trip_checklist_items(trip_id);

-- Index for rule-based deduplication
CREATE INDEX IF NOT EXISTS idx_checklist_rule ON trip_checklist_items(trip_id, rule_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_checklist_updated_at
  BEFORE UPDATE ON trip_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_updated_at();
