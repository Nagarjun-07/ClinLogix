-- Create a table for public profiles (extensions of auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('student', 'instructor', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Crate table for Clinical Log Entries
create table log_entries (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) not null,
  date date not null,
  location text not null,
  specialty text not null,
  hours numeric not null,
  activities text,
  learning_objectives text,
  reflection text,
  supervisor_name text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table log_entries enable row level security;

-- Policies for Log Entries

-- 1. Student can see their own logs
create policy "Students can view own logs"
  on log_entries for select
  using ( auth.uid() = student_id );

-- 2. Instructors/Admins can see all logs (simplified for v1)
-- In a real app, you might want to filter by "assigned" students, but for now:
-- We need a way to check if the current user is an instructor.
-- This usually requires a "custom claim" or a join, which is complex for RLS.
-- ALTERNATIVE: Public read for instructors? No, that's insecure.
-- COMPLEX POLICY:
create policy "Instructors and Admins can view all logs"
  on log_entries for select
  using (
    auth.uid() in (
      select id from profiles where role in ('instructor', 'admin')
    )
  );

-- 3. Students can insert own logs
create policy "Students can insert own logs"
  on log_entries for insert
  with check ( auth.uid() = student_id );

-- 4. Instructors/Admins can update logs (approve/reject/feedback)
create policy "Instructors and Admins can update logs"
  on log_entries for update
  using (
    auth.uid() in (
      select id from profiles where role in ('instructor', 'admin')
    )
  );
