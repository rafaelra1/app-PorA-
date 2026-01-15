-- =============================================================================
-- Supabase Schema: Magazine Spreads Cache
-- Caches AI-generated editorial content to avoid redundant API calls
-- =============================================================================

-- Magazine Spreads Table
CREATE TABLE IF NOT EXISTS magazine_spreads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    city TEXT NOT NULL,
    
    -- Core editorial content (stored as JSONB for flexibility)
    content JSONB NOT NULL,
    
    -- Cache invalidation tracking
    activities_hash TEXT NOT NULL,  -- Hash of activity IDs to detect changes
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(trip_id, day_number)
);

-- Index for fast lookups
CREATE INDEX idx_magazine_spreads_trip ON magazine_spreads(trip_id);
CREATE INDEX idx_magazine_spreads_user ON magazine_spreads(user_id);

-- Row Level Security
ALTER TABLE magazine_spreads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own magazine spreads
CREATE POLICY "Users can view own magazine spreads"
    ON magazine_spreads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own magazine spreads"
    ON magazine_spreads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own magazine spreads"
    ON magazine_spreads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own magazine spreads"
    ON magazine_spreads FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_magazine_spreads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_magazine_spreads_updated_at
    BEFORE UPDATE ON magazine_spreads
    FOR EACH ROW
    EXECUTE FUNCTION update_magazine_spreads_updated_at();
