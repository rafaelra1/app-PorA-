
-- Create trip_members table
create table trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references auth.users(id), -- Nullable for pending invites (email-only)
  email text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  invited_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table trip_members enable row level security;

-- Policies for trip_members

-- 1. Users can view members of trips they are part of (or created)
create policy "Users can view members of their trips"
  on trip_members for select
  using (
    exists (
      select 1 from trips
      where trips.id = trip_members.trip_id
      and trips.user_id = auth.uid()
    )
    or
    exists (
      select 1 from trip_members as tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
      and tm.status = 'accepted'
    )
  );

-- 2. Only Owners and Editors can invite (insert)
create policy "Owners and editors can invite members"
  on trip_members for insert
  with check (
    exists (
      select 1 from trips
      where trips.id = trip_members.trip_id
      and trips.user_id = auth.uid()
    )
    or
    exists (
      select 1 from trip_members as tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'editor')
      and tm.status = 'accepted'
    )
  );

-- 3. Only Owners (and maybe editors?) can update roles/remove members. 
-- For simplicity, let's allow Owners/Editors to update, but restrict what they can do in app logic if needed.
create policy "Owners and editors can update members"
  on trip_members for update
  using (
    exists (
      select 1 from trips
      where trips.id = trip_members.trip_id
      and trips.user_id = auth.uid()
    )
    or
    exists (
      select 1 from trip_members as tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'editor')
      and tm.status = 'accepted'
    )
  );

create policy "Owners and editors can delete members"
  on trip_members for delete
  using (
    exists (
      select 1 from trips
      where trips.id = trip_members.trip_id
      and trips.user_id = auth.uid()
    )
    or
    exists (
      select 1 from trip_members as tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'editor')
      and tm.status = 'accepted'
    )
  );

-- Function to check if user has access to a trip
create or replace function has_trip_access(trip_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from trips
    where id = trip_id
    and user_id = auth.uid()
  ) or exists (
    select 1 from trip_members
    where trip_id = $1
    and user_id = auth.uid()
    and status = 'accepted'
  );
end;
$$ language plpgsql security definer;
