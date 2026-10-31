/*
# Enforce task locking rules in the database

1. Summary
- Tasks can be added only while the challenge is still running, judged by its end date rather than its stored status (which the app refreshes only on load).
- Existing tasks cannot be deleted (no delete permission, unchanged).
- Archiving is limited to ending a task from today (within one day for time zones).
- An archived task cannot be re-activated or have its end date changed.
- Tasks in a finished challenge cannot be changed at all.

2. Security changes
- Recreate the task insert rule so it checks the challenge end date.
- Add a trigger on tasks that enforces the archive rules on every update.

3. Important notes
- Past completion records are unchanged by this migration. They remain protected by the existing occurrence rule.
*/

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = tasks.challenge_id
        AND c.user_id = auth.uid()
        AND c.end_date >= CURRENT_DATE
    )
  );

CREATE OR REPLACE FUNCTION enforce_task_lock_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  challenge_end date;
BEGIN
  SELECT end_date INTO challenge_end FROM challenges WHERE id = OLD.challenge_id;
  IF challenge_end IS NULL OR challenge_end < CURRENT_DATE THEN
    RAISE EXCEPTION 'Tasks in a finished challenge are locked.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF OLD.is_active = false THEN
    IF NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.end_date IS DISTINCT FROM OLD.end_date THEN
      RAISE EXCEPTION 'Archived tasks cannot be changed.' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_active = false THEN
    IF NEW.end_date IS NULL OR NEW.end_date < CURRENT_DATE - 1 OR NEW.end_date > CURRENT_DATE + 1 THEN
      RAISE EXCEPTION 'Tasks can only be archived from today.' USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF NEW.end_date IS DISTINCT FROM OLD.end_date THEN
    RAISE EXCEPTION 'End dates can only be set by archiving a task.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION enforce_task_lock_rules() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_task_lock_rules ON tasks;
CREATE TRIGGER enforce_task_lock_rules
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION enforce_task_lock_rules();
