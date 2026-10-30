import type { Challenge, ChallengeDuration } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { addDaysToKey, todayKey } from '@/lib/dates';
import { computeChallengeStatus } from '@/lib/progress';

export async function fetchLatestChallenge(): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Challenge | null;
}

export async function fetchAllChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Challenge[];
}

export async function createChallenge(duration: ChallengeDuration, startDate: string): Promise<void> {
  const endDate = addDaysToKey(startDate, duration - 1);
  const { error } = await supabase.from('challenges').insert({
    duration,
    start_date: startDate,
    end_date: endDate,
    status: computeChallengeStatus(startDate, endDate, todayKey()),
  });
  if (error) throw error;
}

export async function syncChallengeStatus(challenge: Challenge, today: string): Promise<Challenge> {
  const status = computeChallengeStatus(challenge.start_date, challenge.end_date, today);
  if (status === challenge.status) return challenge;

  const { data, error } = await supabase
    .from('challenges')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', challenge.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Challenge;
}
