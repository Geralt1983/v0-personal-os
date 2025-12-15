-- Create all database tables with RLS

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  timezone text default 'America/New_York',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Tasks table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  energy_level text check (energy_level in ('peak', 'medium', 'low')),
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  estimated_minutes integer default 25,
  deadline timestamp with time zone,
  completed boolean default false,
  completed_at timestamp with time zone,
  skipped boolean default false,
  skip_reason text,
  position integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on tasks
alter table tasks enable row level security;

create policy "Users can view own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_completed_idx on tasks(user_id, completed);

-- Reminders table
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  remind_at timestamp with time zone not null,
  triggered boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS on reminders
alter table reminders enable row level security;

create policy "Users can manage own reminders" on reminders
  for all using (auth.uid() = user_id);

-- Index for reminder queries
create index if not exists reminders_remind_at_idx on reminders(remind_at) where not triggered;

-- User stats table
create table if not exists user_stats (
  user_id uuid references profiles(id) on delete cascade primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  trust_score integer default 50,
  total_completed integer default 0,
  total_skipped integer default 0,
  last_completed_date date,
  updated_at timestamp with time zone default now()
);

-- Enable RLS on user_stats
alter table user_stats enable row level security;

create policy "Users can view own stats" on user_stats
  for select using (auth.uid() = user_id);

create policy "Users can update own stats" on user_stats
  for update using (auth.uid() = user_id);

create policy "Users can insert own stats" on user_stats
  for insert with check (auth.uid() = user_id);

-- Task reasoning table (AI-generated explanations)
create table if not exists task_reasoning (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  energy_match integer check (energy_match between 0 and 100),
  priority_reason text,
  context_note text,
  generated_at timestamp with time zone default now()
);

-- Enable RLS on task_reasoning
alter table task_reasoning enable row level security;

create policy "Users can view own task reasoning" on task_reasoning
  for select using (auth.uid() = user_id);

create policy "Users can insert own task reasoning" on task_reasoning
  for insert with check (auth.uid() = user_id);
