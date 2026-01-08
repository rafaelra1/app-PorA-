-- Create transports table
create table transports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Foreign Keys
  user_id uuid references auth.users(id) not null,
  trip_id uuid references trips(id) on delete cascade not null,

  -- Core Fields
  type text not null, -- flight, train, bus, etc.
  operator text,
  reference text, -- booking ref, flight number
  
  -- Departure
  departure_location text,
  departure_city text,
  departure_date date,
  departure_time text,
  
  -- Arrival
  arrival_location text,
  arrival_city text,
  arrival_date date,
  arrival_time text,
  
  -- Details
  duration text,
  class text, -- economy, business
  seat text,
  vehicle text, -- car model
  
  -- Status & Meta
  status text default 'confirmed',
  price numeric,
  currency text default 'BRL',
  attachments text[], -- Array of URLs
  metadata jsonb default '{}'::jsonb -- For future extensibility
);

-- RLS Policies
alter table transports enable row level security;

create policy "Users can view their own transports"
  on transports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transports"
  on transports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transports"
  on transports for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transports"
  on transports for delete
  using (auth.uid() = user_id);
