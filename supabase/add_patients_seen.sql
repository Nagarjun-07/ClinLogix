-- 1. Add patients_seen column to log_entries if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'log_entries' and column_name = 'patients_seen') then
    alter table log_entries add column patients_seen integer default 0;
  end if;
end $$;

-- 2. Enable Realtime for log_entries safely
do $$
begin
  -- Only add if not already in the publication to avoid errors
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'log_entries'
  ) then
    alter publication supabase_realtime add table log_entries;
  end if;
end $$;
