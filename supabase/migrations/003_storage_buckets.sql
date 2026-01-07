-- =============================================================================
-- PorAí - Storage Buckets Configuration
-- =============================================================================

-- =============================================================================
-- CREATE STORAGE BUCKETS
-- =============================================================================

-- Trip cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-covers', 'trip-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Travel documents (PDFs, tickets, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Journal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-photos', 'journal-photos', false)
ON CONFLICT (id) DO NOTHING;

-- User avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Trip covers: Public read, authenticated upload
CREATE POLICY "Public can view trip covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-covers');

CREATE POLICY "Authenticated users can upload trip covers"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'trip-covers' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own trip covers"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'trip-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own trip covers"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'trip-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents: Private, only owner can access
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Journal photos: Private, only owner can access
CREATE POLICY "Users can view own journal photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload journal photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own journal photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own journal photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'journal-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatars: Public read, user can manage own
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
