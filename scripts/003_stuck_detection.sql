-- Create task skip history table for stuck detection
create table if not exists task_skip_history (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  reason text,
  skipped_at timestamp with time zone default now()
);

-- Enable RLS
alter table task_skip_history enable row level security;

-- RLS policy
create policy "Users can manage own skip history" on task_skip_history
  for all using (auth.uid() = user_id);

-- Index for performance
create index if not exists task_skip_history_task_idx on task_skip_history(task_id);
