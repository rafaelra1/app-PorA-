-- Create the expenses table
create table expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Foreign Keys
  user_id uuid references auth.users(id) not null,
  trip_id uuid references trips(id) on delete cascade,

  -- Data Fields
  title text not null,
  description text,
  category text not null, -- 'alimentacao', 'transporte', 'hospedagem', 'lazer', 'compras', 'outros'
  amount numeric not null,
  type text not null check (type in ('entrada', 'saida')),
  date date not null,
  payment_method text not null
);

-- Enable Row Level Security (RLS)
alter table expenses enable row level security;

-- Policies
create policy "Users can view their own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on expenses for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index expenses_trip_id_idx on expenses(trip_id);
create index expenses_date_idx on expenses(date);
