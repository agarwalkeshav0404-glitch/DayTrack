import type { NewOccurrence, TaskOccurrence } from '@/types/database';
import { supabase } from '@/lib/supabase';

export async function fetchOccurrences(challengeId: string): Promise<TaskOccurrence[]> {
  const { data, error } = await supabase
    .from('task_occurrences')
    .select('*')
    .eq('challenge_id', challengeId);
  if (error) throw error;
  return (data ?? []) as TaskOccurrence[];
}

export async function insertOccurrences(rows: NewOccurrence[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('task_occurrences')
    .upsert(rows, { onConflict: 'task_id,due_date', ignoreDuplicates: true });
  if (error) throw error;
}

export async function setOccurrenceCompleted(occurrenceId: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('task_occurrences')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', occurrenceId);
  if (error) throw error;
}
