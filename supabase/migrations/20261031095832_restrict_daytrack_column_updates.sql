/*
# Restrict signed-in user updates to intended columns

1. Summary
- Supabase default privileges had granted the signed-in role full table update rights.
- That overrode the column-level restrictions from the core schema, so users could edit locked fields.

2. Security changes
- Revoke table-wide UPDATE from the signed-in role on all app tables.
- Re-grant UPDATE only on the columns the app is allowed to change:
  - profiles: full_name, age, occupation, avatar_url
  - challenges: status, completed_at
  - tasks: is_active, end_date
  - task_occurrences: status, completed_at
- Row level security policies are unchanged.
*/

REVOKE UPDATE ON profiles, challenges, tasks, task_occurrences, task_change_logs FROM authenticated;

GRANT UPDATE (full_name, age, occupation, avatar_url) ON profiles TO authenticated;
GRANT UPDATE (status, completed_at) ON challenges TO authenticated;
GRANT UPDATE (is_active, end_date) ON tasks TO authenticated;
GRANT UPDATE (status, completed_at) ON task_occurrences TO authenticated;
