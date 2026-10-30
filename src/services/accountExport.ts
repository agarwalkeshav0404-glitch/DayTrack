import { supabase } from '@/lib/supabase';

export interface AccountExport {
  exportedAt: string;
  profile: unknown;
  challenges: unknown[];
  tasks: unknown[];
  occurrences: unknown[];
  changeLogs: unknown[];
}

async function selectAll(table: string): Promise<unknown[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAccountExport(userId: string): Promise<AccountExport> {
  const [profileResult, challenges, tasks, occurrences, changeLogs] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    selectAll('challenges'),
    selectAll('tasks'),
    selectAll('task_occurrences'),
    selectAll('task_change_logs'),
  ]);
  if (profileResult.error) throw profileResult.error;

  return {
    exportedAt: new Date().toISOString(),
    profile: profileResult.data,
    challenges,
    tasks,
    occurrences,
    changeLogs,
  };
}
