/*
# Tighten table grants for DayTrack

1. Summary
- The app requires sign-in, so the anonymous role no longer needs any access.
- Deleting challenges, tasks, daily occurrences, and change logs is not part of the product. History must stay intact.

2. Security changes
- Revoke all privileges from the anonymous role on every app table.
- Revoke DELETE from the signed-in role on challenges, tasks, task occurrences, task change logs, and profiles.
- Row level security policies are unchanged.
*/

REVOKE ALL ON profiles, challenges, tasks, task_occurrences, task_change_logs FROM anon;

REVOKE DELETE ON profiles, challenges, tasks, task_occurrences, task_change_logs FROM authenticated;
