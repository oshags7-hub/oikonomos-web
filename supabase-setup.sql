-- Run this in Supabase SQL Editor to create all required tables

create table if not exists children (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  grade text,
  user_profile text default 'mom',
  created_at timestamptz default now()
);

create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references children(id) on delete cascade,
  day text not null,
  subject text not null,
  description text,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists calendar_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date text not null,
  time text,
  description text,
  user_profile text default 'mom',
  created_at timestamptz default now()
);

create table if not exists bills (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  amount numeric not null,
  due_date text,
  status text default 'pending',
  category text default 'Other',
  user_profile text default 'mom',
  created_at timestamptz default now()
);

create table if not exists shopping_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  quantity text default '1',
  category text default 'Other',
  checked boolean default false,
  user_profile text default 'mom',
  created_at timestamptz default now()
);

create table if not exists recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  ingredients text,
  instructions text,
  prep_time text,
  user_profile text default 'mom',
  created_at timestamptz default now()
);

create table if not exists home_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  icon text default '🔧',
  status text default 'upcoming',
  notes text,
  user_profile text default 'mom',
  created_at timestamptz default now()
);

create table if not exists bible_notes (
  id uuid default gen_random_uuid() primary key,
  verse text,
  text text not null,
  user_profile text default 'mom',
  created_at timestamptz default now()
);

-- Enable Row Level Security (allow all for now)
alter table children enable row level security;
alter table lessons enable row level security;
alter table calendar_events enable row level security;
alter table bills enable row level security;
alter table shopping_items enable row level security;
alter table recipes enable row level security;
alter table home_tasks enable row level security;
alter table bible_notes enable row level security;

-- Allow all operations for anon key (since we're not using per-user RLS yet)
create policy "allow all" on children for all using (true) with check (true);
create policy "allow all" on lessons for all using (true) with check (true);
create policy "allow all" on calendar_events for all using (true) with check (true);
create policy "allow all" on bills for all using (true) with check (true);
create policy "allow all" on shopping_items for all using (true) with check (true);
create policy "allow all" on recipes for all using (true) with check (true);
create policy "allow all" on home_tasks for all using (true) with check (true);
create policy "allow all" on bible_notes for all using (true) with check (true);
