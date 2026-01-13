-- =============================================================================
-- Journal Entries Schema for "Diário de Experiências"
-- =============================================================================
-- Run this script in your Supabase SQL Editor.

-- 1. Create the journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content fields
    content TEXT NOT NULL,
    location TEXT,
    mood TEXT CHECK (mood IN ('amazing', 'tired', 'hungry', 'cold', 'excited', 'relaxed')),
    tags TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}', -- Array of Storage URLs
    
    -- Metadata
    day_number INTEGER,
    weather_temp INTEGER,
    weather_condition TEXT,
    weather_icon TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_trip_id ON public.journal_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Simple: based on user_id of the entry itself)
-- Users can view their own entries
CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert their own journal entries"
ON public.journal_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_journal_entries_updated_at();


-- =============================================================================
-- Storage Bucket for Trip Memories (Photos)
-- =============================================================================
-- IMPORTANT: You must create the bucket manually in Supabase Dashboard > Storage
-- Bucket name: trip-memories
-- Set as PUBLIC for public URLs

-- 6. Storage Policies for 'trip-memories' bucket
-- NOTE: Only run these AFTER creating the bucket in the Dashboard

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Authenticated users can upload trip memories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'trip-memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public can view trip memories"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'trip-memories');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own trip memories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'trip-memories'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================
-- IMPORTANT: Manual Steps Required
-- =============================================================================
-- After running this script:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named 'trip-memories'
-- 3. Set it as PUBLIC for images to be publicly accessible via URL
-- 4. The storage policies above will automatically apply
