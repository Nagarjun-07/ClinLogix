-- 1. Clinical Activities: Reference table, usually read-only for most
alter table clinical_activities enable row level security;

create policy "Authenticated users can view clinical activities" on clinical_activities
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage clinical activities" on clinical_activities
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 2. Audit Logs: Sensitive system logs
alter table audit_logs enable row level security;

-- Only admins should view audit logs
create policy "Admins can view audit logs" on audit_logs
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- System can insert (triggered events), usually RLS applies to API users. 
-- If your app inserts directly, we need an insert policy.
-- Assuming logs are created by triggers (security definer) or backend logic.
-- If users insert directly (e.g. from client), add:
create policy "Users can create audit logs" on audit_logs
  for insert with check (auth.uid() = actor_id);
