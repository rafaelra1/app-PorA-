-- =============================================================================
-- PorAí - Migration for EXISTING Database
-- Preserves existing trips table and data
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES (create only if not exists)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('flight', 'hotel', 'car', 'insurance', 'activity', 'passport', 'visa', 'vaccine', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('confirmed', 'pending', 'printed', 'expiring', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('alimentacao', 'transporte', 'hospedagem', 'lazer', 'compras', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_type AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transport_type AS ENUM ('flight', 'train', 'car', 'transfer', 'bus', 'ferry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE transport_status AS ENUM ('confirmed', 'scheduled', 'booked', 'pending', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE accommodation_status AS ENUM ('confirmed', 'pending', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE accommodation_type AS ENUM ('hotel', 'home', 'hostel', 'resort', 'apartment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE journal_mood AS ENUM ('amazing', 'tired', 'hungry', 'cold', 'excited', 'relaxed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE checklist_task_category AS ENUM ('visa', 'booking', 'health', 'insurance', 'packing', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE checklist_task_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE luggage_category AS ENUM ('documents', 'clothes', 'hygiene', 'electronics', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('transport', 'accommodation', 'meal', 'sightseeing', 'culture', 'food', 'nature', 'shopping', 'nightlife', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ADD MISSING COLUMNS TO TRIPS (if not exist)
-- =============================================================================

ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_flexible_dates BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- PARTICIPANTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    role VARCHAR(100),
    initials VARCHAR(10),
    is_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DESTINATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    place_id VARCHAR(255),
    start_date DATE,
    end_date DATE,
    image TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    date DATE,
    expiry_date DATE,
    reference VARCHAR(100),
    status document_status DEFAULT 'pending',
    file_url TEXT,
    details TEXT,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    model VARCHAR(100),
    is_offline_available BOOLEAN DEFAULT FALSE,
    is_printed BOOLEAN DEFAULT FALSE,
    check_in_url TEXT,
    map_url TEXT,
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document travelers (many-to-many)
CREATE TABLE IF NOT EXISTS document_travelers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(document_id, participant_id)
);

-- =============================================================================
-- EXPENSES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category expense_category NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type expense_type NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TRANSPORTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS transports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    type transport_type NOT NULL,
    operator VARCHAR(255),
    reference VARCHAR(100),
    route VARCHAR(100),
    departure_location VARCHAR(255),
    departure_city VARCHAR(100),
    departure_time TIME,
    departure_date DATE NOT NULL,
    arrival_location VARCHAR(255),
    arrival_city VARCHAR(100),
    arrival_time TIME,
    arrival_date DATE NOT NULL,
    duration VARCHAR(50),
    class VARCHAR(50),
    seat VARCHAR(20),
    vehicle VARCHAR(100),
    confirmation VARCHAR(100),
    status transport_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ACCOMMODATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    image TEXT,
    rating DECIMAL(2, 1),
    stars INTEGER CHECK (stars >= 1 AND stars <= 5),
    nights INTEGER,
    check_in DATE NOT NULL,
    check_in_time TIME,
    check_out DATE NOT NULL,
    check_out_time TIME,
    confirmation VARCHAR(100),
    status accommodation_status DEFAULT 'pending',
    type accommodation_type DEFAULT 'hotel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ITINERARY ACTIVITIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS itinerary_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    day INTEGER NOT NULL,
    date DATE NOT NULL,
    time TIME,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    location_detail VARCHAR(255),
    type activity_type DEFAULT 'other',
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    price VARCHAR(50),
    image TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- JOURNAL ENTRIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_number INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    title VARCHAR(255),
    content TEXT NOT NULL,
    mood journal_mood,
    weather_temp INTEGER,
    weather_condition VARCHAR(50),
    weather_icon VARCHAR(50),
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal images
CREATE TABLE IF NOT EXISTS journal_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- Journal tags
CREATE TABLE IF NOT EXISTS journal_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL
);

-- =============================================================================
-- CHECKLIST TASKS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS checklist_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority checklist_task_priority DEFAULT 'medium',
    is_critical BOOLEAN DEFAULT FALSE,
    deadline DATE,
    category checklist_task_category DEFAULT 'other',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- LUGGAGE ITEMS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS luggage_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    packed BOOLEAN DEFAULT FALSE,
    category luggage_category DEFAULT 'other',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CITY GUIDES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS city_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    overview TEXT,
    attractions JSONB DEFAULT '[]',
    typical_dishes JSONB DEFAULT '[]',
    gastronomy JSONB DEFAULT '[]',
    tips JSONB DEFAULT '[]',
    essentials JSONB DEFAULT '[]',
    emergency JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(city_name, country)
);

-- =============================================================================
-- INDEXES (create only if not exists)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_participants_trip_id ON participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_destinations_trip_id ON destinations(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip_id ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_transports_trip_id ON transports(trip_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_trip_id ON accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_id ON itinerary_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_journal_trip_id ON journal_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_checklist_trip_id ON checklist_tasks(trip_id);
CREATE INDEX IF NOT EXISTS idx_luggage_trip_id ON luggage_items(trip_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers (drop first to avoid errors)
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_city_guides_updated_at ON city_guides;
CREATE TRIGGER update_city_guides_updated_at BEFORE UPDATE ON city_guides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! All tables created.';
END $$;
