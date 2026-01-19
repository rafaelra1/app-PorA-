
-- Update Trips policies to include shared trips

-- Drop existing generic select policy if it exists (assuming "Users can view their own trips")
drop policy if exists "Users can view their own trips" on trips;

create policy "Users can view their own and shared trips"
  on trips for select
  using (
    user_id = auth.uid()
    or
    exists (
      select 1 from trip_members
      where trip_members.trip_id = trips.id
      and trip_members.user_id = auth.uid()
      and trip_members.status = 'accepted'
    )
    or
    is_public = true -- Assuming there is an is_public column, if not we need to add it
  );

-- Assuming 'is_public' column might need to be added to trips if not present
-- alter table trips add column if not exists is_public boolean default false;

-- Similar updates for other tables (accommodations, etc) would be ideal 
-- but often they rely on "trip_id" checks. 
-- We need to make sure those checks utilize the new permission logic.
-- Ideally, we create a helper function or update those policies to use `has_trip_access(trip_id)`.

-- Example update for accommodations
drop policy if exists "Users can view their own accommodations" on accommodations;
create policy "Users can view trip accommodations"
  on accommodations for select
  using (
    exists (
        select 1 from trips
        where trips.id = accommodations.trip_id
        and (
            trips.user_id = auth.uid()
            or exists (
                select 1 from trip_members
                where trip_members.trip_id = trips.id
                and trip_members.user_id = auth.uid()
                and trip_members.status = 'accepted'
            )
        )
    )
  );
