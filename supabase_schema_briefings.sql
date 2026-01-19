-- Create the city_briefings table to store AI-generated pre-trip briefings
create table city_briefings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Foreign Keys & Relationships
  trip_id uuid references trips(id) on delete cascade not null,
  
  -- Metadata
  city_name text not null,
  country text not null,
  
  -- The actual content
  data jsonb not null,
  
  -- Constraints
  -- Ensure only one briefing per city per trip
  constraint city_briefings_trip_city_key unique (trip_id, city_name, country)
);

-- Enable Row Level Security (RLS)
alter table city_briefings enable row level security;

-- Policies

-- Users can view briefings for their own trips
create policy "Users can view briefings for their trips"
  on city_briefings for select
  using (
    exists (
      select 1 from trips
      where trips.id = city_briefings.trip_id
      and trips.user_id = auth.uid()
    )
    or
    exists (
       -- If access via trip_members is implemented, add check here. 
       -- For now, relying on trip ownership or basic RLS if simpler.
       -- Assuming trips.user_id check is sufficient for current scope.
       select 1 from trips
       where trips.id = city_briefings.trip_id
       and trips.user_id = auth.uid()
    )
  );

-- Users can insert briefings for their trips
create policy "Users can insert briefings for their trips"
  on city_briefings for insert
  with check (
    exists (
      select 1 from trips
      where trips.id = city_briefings.trip_id
      and trips.user_id = auth.uid()
    )
  );

-- Users can update briefings for their trips
create policy "Users can update briefings for their trips"
  on city_briefings for update
  using (
    exists (
      select 1 from trips
      where trips.id = city_briefings.trip_id
      and trips.user_id = auth.uid()
    )
  );

-- Helper trigger to update 'updated_at'
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on city_briefings
  for each row execute procedure moddatetime (updated_at);
