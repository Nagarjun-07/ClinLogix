-- Create Institutions table
create table institutions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for institutions
alter table institutions enable row level security;

-- Policies for institutions
-- 1. Everyone can read institutions (needed for verifying invites or looking up names, potentially)
-- For tighter security, we can restrict this later, but for now:
create policy "Everyone can view institutions"
  on institutions for select
  using ( true );

-- 2. Admins can insert (during registration)
create policy "Authenticated users can create institutions"
  on institutions for insert
  with check ( auth.role() = 'authenticated' );

-- Update profiles to link to institutions
alter table profiles 
add column institution_id uuid references institutions(id);

-- Update authorized_users (invites) to also link to institution (optional but good for data integrity)
alter table authorized_users
add column institution_id uuid references institutions(id);
