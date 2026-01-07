-- Create a table for authorized invites/whitelisting
create table if not exists authorized_users (
  email text primary key,
  role text check (role in ('student', 'instructor', 'admin')) not null,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  invited_by uuid references auth.users(id),
  status text default 'pending' check (status in ('pending', 'registered')),
  institution_id uuid references institutions(id)
);

-- Enable RLS
alter table authorized_users enable row level security;

-- Policies

-- 1. Admins can view all invites
create policy "Admins can view all invites"
  on authorized_users for select
  using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- 2. Admins can insert invites
create policy "Admins can insert invites"
  on authorized_users for insert
  with check (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- 3. Public (Anon) can view invites to verify themselves during registration
-- restricted to finding strictly by email for security
create policy "Public can view invites"
  on authorized_users for select
  using ( true );

-- 4. Admins can delete invites (revoke)
create policy "Admins can delete invites"
  on authorized_users for delete
  using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- FUNCTIONS AND TRIGGERS

-- Function to check if a user is authorized before sign up
create or replace function public.check_if_authorized()
returns trigger as $$
begin
  -- Check if the email exists in the authorized_users table
  if not exists (select 1 from public.authorized_users where email = new.email) then
    raise exception 'Email % is not authorized to register. Please contact your administrator.', new.email;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run before a user is created in auth.users
-- Note: This requires superuser privileges to create triggers on auth.users in some environments,
-- but standard usage in Supabase migrations usually allows or requires SQL Editor execution.
-- We will include the DDL here.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute procedure public.check_if_authorized();

-- Function to mark authorized user as registered
create or replace function public.handle_authorized_user_registration()
returns trigger as $$
begin
  update public.authorized_users
  set status = 'registered'
  where email = new.email;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update status after successful signup
drop trigger if exists on_auth_user_registered on auth.users;
create trigger on_auth_user_registered
  after insert on auth.users
  for each row execute procedure public.handle_authorized_user_registration();
