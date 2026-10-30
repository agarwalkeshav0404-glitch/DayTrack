import type { Profile } from '@/types/database';
import { supabase } from '@/lib/supabase';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export interface ProfileInput {
  full_name: string;
  age: number | null;
  occupation: string | null;
}

export async function createProfile(userId: string, input: ProfileInput): Promise<void> {
  const { error } = await supabase.from('profiles').insert({ id: userId, ...input });
  if (error) throw error;
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  const { error } = await supabase.from('profiles').update(input).eq('id', userId);
  if (error) throw error;
}
