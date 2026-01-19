
-- Add is_public column to trips table
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'trips' and column_name = 'is_public') then
        alter table trips add column is_public boolean default false;
    end if;
end $$;

-- Update RLS for trips to include public access (view only)
drop policy if exists "Public trips are viewable by everyone" on trips;
create policy "Public trips are viewable by everyone"
  on trips for select
  using (is_public = true);
