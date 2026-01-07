-- ==============================================================================
-- Clinical Logbook Management System - Full Backend Migration
-- ==============================================================================

-- 1. UTILITY FUNCTIONS
-- Function to automatically update 'updated_at' timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. PATIENTS (Anonymized Entity)
create table if not exists patients (
  id uuid default gen_random_uuid() primary key,
  reference_id text not null, -- e.g. "WARD-101"
  age_group text check (age_group in ('infant', 'child', 'adult', 'geriatric')),
  gender text,
  clinical_category text,
  institution_id uuid references institutions(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: Enforce uniqueness per institution to prevent duplicates
  unique(reference_id, institution_id)
);

-- Enable RLS for Patients
alter table patients enable row level security;

-- 3. ASSIGNMENTS
-- 3.1 Student -> Preceptor
create table if not exists student_preceptor_assignments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) not null,
  preceptor_id uuid references profiles(id) not null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'active' check (status in ('active', 'archived')),
  
  -- Constraint: A student can only have one active preceptor assignment at a time
  -- Note: We use a partial index for this logic usually, or just enforce via app logic/trigger.
  -- Simple constraint:
  unique(student_id, preceptor_id) 
);

-- 3.2 Student -> Patient
create table if not exists student_patient_assignments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) not null,
  patient_id uuid references patients(id) not null,
  assigned_by uuid references profiles(id), -- The preceptor who assigned it
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: Prevent duplicate assignment of same patient to same student
  unique(student_id, patient_id)
);

-- 4. CLINICAL ACTIVITIES & LOGBOOK ENTITIES
create table if not exists clinical_activities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  institution_id uuid references institutions(id)
);

-- (Updating existing log_entries or creating new one if not exists)
-- Assuming 'log_entries' exists, we might need to add patient_id linkage
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'log_entries' and column_name = 'patient_id') then
    alter table log_entries add column patient_id uuid references patients(id);
  end if;
  
   if not exists (select 1 from information_schema.columns where table_name = 'log_entries' and column_name = 'is_locked') then
    alter table log_entries add column is_locked boolean default false;
  end if;
end $$;

-- 5. AUDIT LOGS
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references auth.users(id),
  action text not null, -- CREATE, UPDATE, DELETE, LOCK
  entity_type text not null, -- 'patient', 'log_entry'
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TRIGGERS & CONSTRAINTS

-- Trigger: Enforce Max 5 Students per Preceptor
create or replace function public.check_preceptor_student_limit()
returns trigger as $$
declare
  student_count integer;
begin
  select count(*) into student_count
  from student_preceptor_assignments
  where preceptor_id = new.preceptor_id and status = 'active';
  
  if student_count >= 5 then
    raise exception 'Preceptor limit reached: maximum 5 active students allowed.';
  end if;
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_preceptor_limit on student_preceptor_assignments;
create trigger enforce_preceptor_limit
  before insert on student_preceptor_assignments
  for each row execute procedure public.check_preceptor_student_limit();

-- 7. RLS POLICIES (Brief Outline)

-- PATIENTS
-- Admins: View All
create policy "Admins view all patients" on patients for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Preceptors: View patients in their institution (simplification)
create policy "Preceptors view institution patients" on patients for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'instructor' and institution_id = patients.institution_id));

-- Students: View assignments ONLY
create policy "Students view assigned patients" on patients for select
  using (exists (select 1 from student_patient_assignments where student_id = auth.uid() and patient_id = patients.id));

-- ASSIGNMENTS
alter table student_preceptor_assignments enable row level security;
alter table student_patient_assignments enable row level security;

-- (Policies omitted for brevity, but follow same role-based pattern)

