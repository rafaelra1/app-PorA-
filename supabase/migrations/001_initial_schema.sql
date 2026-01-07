-- =============================================================================
-- PorAí - Database Schema for Supabase
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE trip_status AS ENUM ('planning', 'confirmed', 'completed');
CREATE TYPE document_type AS ENUM ('flight', 'hotel', 'car', 'insurance', 'activity', 'passport', 'visa', 'vaccine', 'other');
CREATE TYPE document_status AS ENUM ('confirmed', 'pending', 'printed', 'expiring', 'cancelled');
CREATE TYPE expense_category AS ENUM ('alimentacao', 'transporte', 'hospedagem', 'lazer', 'compras', 'outros');
CREATE TYPE expense_type AS ENUM ('entrada', 'saida');
CREATE TYPE transport_type AS ENUM ('flight', 'train', 'car', 'transfer', 'bus', 'ferry');
CREATE TYPE transport_status AS ENUM ('confirmed', 'scheduled', 'booked', 'pending', 'cancelled');
CREATE TYPE accommodation_status AS ENUM ('confirmed', 'pending', 'cancelled');
CREATE TYPE accommodation_type AS ENUM ('hotel', 'home', 'hostel', 'resort', 'apartment');
CREATE TYPE journal_mood AS ENUM ('amazing', 'tired', 'hungry', 'cold', 'excited', 'relaxed');
CREATE TYPE checklist_task_category AS ENUM ('visa', 'booking', 'health', 'insurance', 'packing', 'other');
CREATE TYPE checklist_task_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE luggage_category AS ENUM ('documents', 'clothes', 'hygiene', 'electronics', 'other');
CREATE TYPE activity_type AS ENUM ('transport', 'accommodation', 'meal', 'sightseeing', 'culture', 'food', 'nature', 'shopping', 'nightlife', 'other');

-- =============================================================================
-- TRIPS TABLE (Main entity)
-- =============================================================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_flexible_dates BOOLEAN DEFAULT FALSE,
    status trip_status DEFAULT 'planning',
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PARTICIPANTS TABLE
-- =============================================================================

CREATE TABLE participants (
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
-- DESTINATIONS TABLE (Detailed destinations per trip)
-- =============================================================================

CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    place_id VARCHAR(255), -- Google Places ID
    start_date DATE,
    end_date DATE,
    image TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE documents (
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
    -- Actions
    check_in_url TEXT,
    map_url TEXT,
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document travelers (many-to-many)
CREATE TABLE document_travelers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(document_id, participant_id)
);

-- =============================================================================
-- EXPENSES TABLE
-- =============================================================================

CREATE TABLE expenses (
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

CREATE TABLE transports (
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

CREATE TABLE accommodations (
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

CREATE TABLE itinerary_activities (
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

CREATE TABLE journal_entries (
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

-- Journal images (one-to-many)
CREATE TABLE journal_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- Journal tags (one-to-many)
CREATE TABLE journal_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL
);

-- =============================================================================
-- CHECKLIST TASKS TABLE (Tarefas)
-- =============================================================================

CREATE TABLE checklist_tasks (
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
-- LUGGAGE ITEMS TABLE (Bagagem)
-- =============================================================================

CREATE TABLE luggage_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    packed BOOLEAN DEFAULT FALSE,
    category luggage_category DEFAULT 'other',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CITY GUIDES TABLE (Cached AI-generated guides)
-- =============================================================================

CREATE TABLE city_guides (
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
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);

CREATE INDEX idx_participants_trip_id ON participants(trip_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);

CREATE INDEX idx_destinations_trip_id ON destinations(trip_id);

CREATE INDEX idx_documents_trip_id ON documents(trip_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

CREATE INDEX idx_transports_trip_id ON transports(trip_id);
CREATE INDEX idx_transports_date ON transports(departure_date);

CREATE INDEX idx_accommodations_trip_id ON accommodations(trip_id);
CREATE INDEX idx_accommodations_dates ON accommodations(check_in, check_out);

CREATE INDEX idx_itinerary_trip_id ON itinerary_activities(trip_id);
CREATE INDEX idx_itinerary_date ON itinerary_activities(date);

CREATE INDEX idx_journal_trip_id ON journal_entries(trip_id);
CREATE INDEX idx_journal_date ON journal_entries(date);

CREATE INDEX idx_checklist_trip_id ON checklist_tasks(trip_id);
CREATE INDEX idx_luggage_trip_id ON luggage_items(trip_id);

CREATE INDEX idx_city_guides_city ON city_guides(city_name);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city_guides_updated_at BEFORE UPDATE ON city_guides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
