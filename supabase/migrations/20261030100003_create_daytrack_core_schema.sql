/*
# Create DayTrack core schema

1. New Tables
- `profiles`: one row per user with name, age, occupation and optional avatar URL.
- `challenges`: 30-day or 101-day challenges with start/end dates and status (upcoming, active, completed).
- `tasks`: recurring (daily or selected weekdays) and scheduled (single date) tasks, linked to a challenge.
- `task_occurrences`: one row per task per due date, storing completion state and timestamp. Unique per task and date.
- `task_change_logs`: append-only history of task creation and archiving.

2. Security
- Row level security enabled on every table.
- All policies are owner-scoped using auth.uid() and apply to the authenticated role only.
- Tasks, occurrences and change logs cannot be deleted by users (no DELETE grant), protecting challenge history.
- Task occurrences can only be changed for today or the previous day (one-day grace for time zones), so past completion records stay read-only.
- Column-level UPDATE grants limit which fields users can change (profile fields, task archive fields, occurrence completion fields).

3. Important Notes
- At most one upcoming or active challenge per user is enforced by a partial unique index.
- Daily completion and missed status are derived from occurrences; no background job is needed.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  age integer CHECK (age IS NULL OR age BETWEEN 5 AND 120),
  occupation text CHECK (occupation IS NULL OR char_length(occupation) <= 120),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  duration integer NOT NULL CHECK (duration IN (30, 101)),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS challenges_one_open_per_user
  ON challenges (user_id) WHERE status IN ('upcoming', 'active');
CREATE INDEX IF NOT EXISTS challenges_user_id_idx ON challenges (user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  category text NOT NULL CHECK (category IN ('Health', 'Study', 'Work', 'Personal', 'Creative', 'Other')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  task_type text NOT NULL CHECK (task_type IN ('recurring', 'scheduled')),
  frequency text CHECK (frequency IN ('daily', 'weekly')),
  weekdays smallint[] NOT NULL DEFAULT '{}',
  scheduled_date date,
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (task_type = 'recurring' AND frequency IS NOT NULL AND scheduled_date IS NULL
      AND (frequency = 'daily' OR cardinality(weekdays) > 0))
    OR
    (task_type = 'scheduled' AND scheduled_date IS NOT NULL AND frequency IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS tasks_challenge_id_idx ON tasks (challenge_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id);

CREATE TABLE IF NOT EXISTS task_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_day integer NOT NULL CHECK (challenge_day >= 1),
  due_date date NOT NULL,
  title_snapshot text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, due_date),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS task_occurrences_challenge_due_idx ON task_occurrences (challenge_id, due_date);
CREATE INDEX IF NOT EXISTS task_occurrences_user_id_idx ON task_occurrences (user_id);

CREATE TABLE IF NOT EXISTS task_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('created', 'archived')),
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_change_logs_task_id_idx ON task_change_logs (task_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_change_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON profiles TO authenticated;
GRANT UPDATE (full_name, age, occupation, avatar_url) ON profiles TO authenticated;
GRANT SELECT, INSERT ON challenges TO authenticated;
GRANT UPDATE (status, completed_at) ON challenges TO authenticated;
GRANT SELECT, INSERT ON tasks TO authenticated;
GRANT UPDATE (is_active, end_date) ON tasks TO authenticated;
GRANT SELECT, INSERT ON task_occurrences TO authenticated;
GRANT UPDATE (status, completed_at) ON task_occurrences TO authenticated;
GRANT SELECT, INSERT ON task_change_logs TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "select_own_challenges" ON challenges;
CREATE POLICY "select_own_challenges" ON challenges FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_challenges" ON challenges;
CREATE POLICY "insert_own_challenges" ON challenges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_challenges" ON challenges;
CREATE POLICY "update_own_challenges" ON challenges FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = tasks.challenge_id
        AND c.user_id = auth.uid()
        AND c.status IN ('upcoming', 'active')
    )
  );
DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_occurrences" ON task_occurrences;
CREATE POLICY "select_own_occurrences" ON task_occurrences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_occurrences" ON task_occurrences;
CREATE POLICY "insert_own_occurrences" ON task_occurrences FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_occurrences.task_id AND t.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "update_recent_occurrences" ON task_occurrences;
CREATE POLICY "update_recent_occurrences" ON task_occurrences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND due_date >= CURRENT_DATE - 1)
  WITH CHECK (auth.uid() = user_id AND due_date >= CURRENT_DATE - 1);

DROP POLICY IF EXISTS "select_own_change_logs" ON task_change_logs;
CREATE POLICY "select_own_change_logs" ON task_change_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_change_logs" ON task_change_logs;
CREATE POLICY "insert_own_change_logs" ON task_change_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
