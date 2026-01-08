-- Create itinerary_activities table
CREATE TABLE itinerary_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INTEGER,
  date DATE, -- Storing as YYYY-MM-DD
  time TIME, -- Storing as HH:mm
  title TEXT NOT NULL,
  location TEXT,
  location_detail TEXT,
  type TEXT NOT NULL, -- 'transport', 'accommodation', 'meal', 'sightseeing', etc.
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  image TEXT,
  price NUMERIC,
  duration INTEGER, -- Duration in minutes
  coordinates JSONB, -- { lat: number, lng: number }
  is_generating_image BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own itinerary activities"
  ON itinerary_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itinerary activities"
  ON itinerary_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itinerary activities"
  ON itinerary_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itinerary activities"
  ON itinerary_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster querying by trip
CREATE INDEX idx_itinerary_activities_trip_id ON itinerary_activities(trip_id);
