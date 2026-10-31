import { useCallback, useEffect, useState } from 'react';
import type { Challenge, Profile, Task, TaskOccurrence } from '@/types/database';
import { todayKey } from '@/lib/dates';
import { buildMissingOccurrences } from '@/lib/progress';
import { fetchProfile } from '@/services/profiles';
import { fetchLatestChallenge, syncChallengeStatus } from '@/services/challenges';
import { fetchChallengeTasks } from '@/services/tasks';
import { fetchOccurrences, insertOccurrences } from '@/services/occurrences';

export interface AppData {
  profile: Profile | null;
  challenge: Challenge | null;
  tasks: Task[];
  occurrences: TaskOccurrence[];
}

export interface Workspace {
  profile: Profile;
  challenge: Challenge;
  tasks: Task[];
  occurrences: TaskOccurrence[];
}

export interface AppDataState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: AppData | null;
  reload: () => Promise<void>;
}

async function loadAppData(userId: string): Promise<AppData> {
  const profile = await fetchProfile(userId);
  if (!profile) return { profile: null, challenge: null, tasks: [], occurrences: [] };

  const latest = await fetchLatestChallenge();
  if (!latest) return { profile, challenge: null, tasks: [], occurrences: [] };

  const today = todayKey();
  const challenge = await syncChallengeStatus(latest, today);
  const tasks = await fetchChallengeTasks(challenge.id);

  let occurrences = await fetchOccurrences(challenge.id);
  const missing = buildMissingOccurrences(challenge, tasks, occurrences, today);
  if (missing.length > 0) {
    await insertOccurrences(missing);
    occurrences = await fetchOccurrences(challenge.id);
  }

  return { profile, challenge, tasks, occurrences };
}

export function useAppData(userId: string | null): AppDataState {
  const [data, setData] = useState<AppData | null>(null);
  const [status, setStatus] = useState<AppDataState['status']>('idle');

  const reload = useCallback(async () => {
    if (!userId) return;
    setStatus((previous) => (previous === 'ready' ? previous : 'loading'));
    try {
      const next = await loadAppData(userId);
      setData(next);
      setStatus('ready');
    } catch (error) {
      console.error('Failed to load DayTrack data', error);
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setStatus('idle');
      return;
    }
    void reload();

    const handleVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [userId, reload]);

  return { status, data, reload };
}
