-- =============================================================================
-- PorAí - Row Level Security (RLS) Policies
-- =============================================================================
-- These policies ensure each user can only access their own data

-- =============================================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

DROP POLICY IF EXISTS "Users can view participants" ON participants;
DROP POLICY IF EXISTS "Trip owners can add participants" ON participants;
DROP POLICY IF EXISTS "Trip owners can update participants" ON participants;
DROP POLICY IF EXISTS "Trip owners can delete participants" ON participants;

DROP POLICY IF EXISTS "Users can view destinations" ON destinations;
DROP POLICY IF EXISTS "Users can manage destinations" ON destinations;

DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can manage documents" ON documents;

DROP POLICY IF EXISTS "Users can view document_travelers" ON document_travelers;
DROP POLICY IF EXISTS "Users can manage document_travelers" ON document_travelers;

DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view transports" ON transports;
DROP POLICY IF EXISTS "Users can manage transports" ON transports;

DROP POLICY IF EXISTS "Users can view accommodations" ON accommodations;
DROP POLICY IF EXISTS "Users can manage accommodations" ON accommodations;

DROP POLICY IF EXISTS "Users can view itinerary" ON itinerary_activities;
DROP POLICY IF EXISTS "Users can manage itinerary" ON itinerary_activities;

DROP POLICY IF EXISTS "Users can view journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can manage journal entries" ON journal_entries;

DROP POLICY IF EXISTS "Users can view journal images" ON journal_images;
DROP POLICY IF EXISTS "Users can manage journal images" ON journal_images;

DROP POLICY IF EXISTS "Users can view journal tags" ON journal_tags;
DROP POLICY IF EXISTS "Users can manage journal tags" ON journal_tags;

DROP POLICY IF EXISTS "Users can view checklist tasks" ON checklist_tasks;
DROP POLICY IF EXISTS "Users can manage checklist tasks" ON checklist_tasks;

DROP POLICY IF EXISTS "Users can view luggage items" ON luggage_items;
DROP POLICY IF EXISTS "Users can manage luggage items" ON luggage_items;

DROP POLICY IF EXISTS "Authenticated users can read city guides" ON city_guides;
DROP POLICY IF EXISTS "Authenticated users can create city guides" ON city_guides;
DROP POLICY IF EXISTS "Authenticated users can update city guides" ON city_guides;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE luggage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_guides ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION: Check if user has access to a trip
-- =============================================================================

CREATE OR REPLACE FUNCTION user_has_trip_access(trip_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips
        WHERE id = trip_uuid AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM participants
        WHERE trip_id = trip_uuid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIPS POLICIES
-- =============================================================================

-- Users can view their own trips or trips they participate in
CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT USING (
        user_id = auth.uid() OR
        id IN (SELECT trip_id FROM participants WHERE user_id = auth.uid())
    );

-- Users can create trips (automatically owned)
CREATE POLICY "Users can create trips" ON trips
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own trips
CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- PARTICIPANTS POLICIES
-- =============================================================================

-- Users can view participants of trips they have access to
CREATE POLICY "Users can view participants" ON participants
    FOR SELECT USING (user_has_trip_access(trip_id));

-- Trip owners can add participants
CREATE POLICY "Trip owners can add participants" ON participants
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())
    );

-- Trip owners can update participants
CREATE POLICY "Trip owners can update participants" ON participants
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())
    );

-- Trip owners can remove participants
CREATE POLICY "Trip owners can delete participants" ON participants
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())
    );

-- =============================================================================
-- DESTINATIONS POLICIES
-- =============================================================================

CREATE POLICY "Users can view destinations" ON destinations
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage destinations" ON destinations
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- DOCUMENTS POLICIES
-- =============================================================================

CREATE POLICY "Users can view documents" ON documents
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage documents" ON documents
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- DOCUMENT_TRAVELERS POLICIES
-- =============================================================================

CREATE POLICY "Users can view document_travelers" ON document_travelers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND user_has_trip_access(d.trip_id)
        )
    );

CREATE POLICY "Users can manage document_travelers" ON document_travelers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND user_has_trip_access(d.trip_id)
        )
    );

-- =============================================================================
-- EXPENSES POLICIES
-- =============================================================================

CREATE POLICY "Users can view expenses" ON expenses
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage expenses" ON expenses
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- TRANSPORTS POLICIES
-- =============================================================================

CREATE POLICY "Users can view transports" ON transports
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage transports" ON transports
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- ACCOMMODATIONS POLICIES
-- =============================================================================

CREATE POLICY "Users can view accommodations" ON accommodations
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage accommodations" ON accommodations
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- ITINERARY_ACTIVITIES POLICIES
-- =============================================================================

CREATE POLICY "Users can view itinerary" ON itinerary_activities
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage itinerary" ON itinerary_activities
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- JOURNAL_ENTRIES POLICIES
-- =============================================================================

CREATE POLICY "Users can view journal entries" ON journal_entries
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage journal entries" ON journal_entries
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- JOURNAL_IMAGES POLICIES
-- =============================================================================

CREATE POLICY "Users can view journal images" ON journal_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id AND user_has_trip_access(je.trip_id)
        )
    );

CREATE POLICY "Users can manage journal images" ON journal_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id AND user_has_trip_access(je.trip_id)
        )
    );

-- =============================================================================
-- JOURNAL_TAGS POLICIES
-- =============================================================================

CREATE POLICY "Users can view journal tags" ON journal_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id AND user_has_trip_access(je.trip_id)
        )
    );

CREATE POLICY "Users can manage journal tags" ON journal_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_id AND user_has_trip_access(je.trip_id)
        )
    );

-- =============================================================================
-- CHECKLIST_TASKS POLICIES
-- =============================================================================

CREATE POLICY "Users can view checklist tasks" ON checklist_tasks
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage checklist tasks" ON checklist_tasks
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- LUGGAGE_ITEMS POLICIES
-- =============================================================================

CREATE POLICY "Users can view luggage items" ON luggage_items
    FOR SELECT USING (user_has_trip_access(trip_id));

CREATE POLICY "Users can manage luggage items" ON luggage_items
    FOR ALL USING (user_has_trip_access(trip_id));

-- =============================================================================
-- CITY_GUIDES POLICIES (Public read, authenticated write)
-- =============================================================================

-- City guides are cached and shared, anyone authenticated can read
CREATE POLICY "Authenticated users can read city guides" ON city_guides
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can create/update guides (for caching)
CREATE POLICY "Authenticated users can create city guides" ON city_guides
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update city guides" ON city_guides
    FOR UPDATE USING (auth.role() = 'authenticated');
