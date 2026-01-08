-- Create the accommodations table
create table accommodations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Foreign Keys
  user_id uuid references auth.users(id) not null,
  trip_id uuid references trips(id) on delete cascade,
  city_id text, -- Simplified to text to match existing city IDs which might be strings or uuids

  -- Data Fields
  name text not null,
  address text,
  image text,
  stars numeric,
  rating numeric,
  nights integer,
  
  -- Dates & Times
  check_in date not null,
  check_in_time text default '14:00',
  check_out date not null,
  check_out_time text default '11:00',
  
  confirmation_code text,
  status text default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled')),
  type text default 'hotel' -- 'hotel' or 'home'
);

-- Enable Row Level Security (RLS)
alter table accommodations enable row level security;

-- Policies
create policy "Users can view their own accommodations"
  on accommodations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accommodations"
  on accommodations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accommodations"
  on accommodations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own accommodations"
  on accommodations for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index accommodations_trip_id_idx on accommodations(trip_id);
