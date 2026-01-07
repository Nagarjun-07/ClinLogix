-- 1. Add new columns safely
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'authorized_users' and column_name = 'status') then
    alter table authorized_users add column status text default 'pending' check (status in ('pending', 'registered'));
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'authorized_users' and column_name = 'institution_id') then
    alter table authorized_users add column institution_id uuid references institutions(id);
  end if;
end $$;

-- 2. Add/Update Functions (Safe to run multiple times)
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

create or replace function public.handle_authorized_user_registration()
returns trigger as $$
begin
  update public.authorized_users
  set status = 'registered'
  where email = new.email;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Add/Update Triggers (Safe to run multiple times)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute procedure public.check_if_authorized();

drop trigger if exists on_auth_user_registered on auth.users;
create trigger on_auth_user_registered
  after insert on auth.users
  for each row execute procedure public.handle_authorized_user_registration();
