import type { Task, TaskCategory, TaskFrequency, TaskPriority, TaskType } from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface NewTaskInput {
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  task_type: TaskType;
  frequency: TaskFrequency | null;
  weekdays: number[];
  scheduled_date: string | null;
  start_date: string;
}

export async function fetchChallengeTasks(challengeId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(challengeId: string, input: NewTaskInput): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ challenge_id: challengeId, ...input })
    .select('*')
    .single();
  if (error) throw error;

  const task = data as Task;
  const { error: logError } = await supabase.from('task_change_logs').insert({
    task_id: task.id,
    change_type: 'created',
    new_value: {
      title: task.title,
      task_type: task.task_type,
      frequency: task.frequency,
      weekdays: task.weekdays,
      scheduled_date: task.scheduled_date,
      start_date: task.start_date,
    },
  });
  if (logError) throw logError;
}

export async function archiveTask(task: Task, today: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ is_active: false, end_date: today })
    .eq('id', task.id);
  if (error) throw error;

  const { error: logError } = await supabase.from('task_change_logs').insert({
    task_id: task.id,
    change_type: 'archived',
    old_value: { is_active: task.is_active, end_date: task.end_date },
    new_value: { is_active: false, end_date: today },
  });
  if (logError) throw logError;
}
