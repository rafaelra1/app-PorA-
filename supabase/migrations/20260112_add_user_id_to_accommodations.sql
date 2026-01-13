-- Add user_id column to accommodations table if it doesn't exist
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id);

-- It should probably be not null, but let's add it first. 
-- Existing rows might break if we enforce not null immediately without a default.
-- For now, let's just add it.
