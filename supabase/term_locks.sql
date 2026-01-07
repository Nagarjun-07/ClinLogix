-- Create table for term locks
create table public.term_locks (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) not null,
  term text not null, -- e.g., "Fall 2025"
  locked_at timestamptz default now(),
  locked_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(student_id, term)
);

-- Enable RLS
alter table public.term_locks enable row level security;

-- Policies
create policy "Admins can manage locks"
  on public.term_locks for all
  using (
    exists (
      select 1 from public.authorized_users
      where email = auth.jwt() ->> 'email'
      and role = 'admin' -- Assuming role check via authorized_users or metadata
    )
  );

create policy "Users can view their own locks"
    on public.term_locks for select
    using (auth.uid() = student_id);

-- Add simple policy for now to unblock development if role check is complex
create policy "Authenticated users can view locks"
    on public.term_locks for select
    using (auth.role() = 'authenticated');
