-- Run this query in your Supabase Project's SQL Editor
-- This will manually confirm the email addresses for your test users
-- so you can log in without clicking a verification link.

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email IN (
  'student@medical.edu',
  'instructor@medical.edu',
  'admin@medical.edu'
);
