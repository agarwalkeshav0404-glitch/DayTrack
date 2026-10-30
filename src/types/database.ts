export type ChallengeDuration = 30 | 101;
export type ChallengeStatus = 'upcoming' | 'active' | 'completed';
export type TaskCategory = 'Health' | 'Study' | 'Work' | 'Personal' | 'Creative' | 'Other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'recurring' | 'scheduled';
export type TaskFrequency = 'daily' | 'weekly';
export type OccurrenceStatus = 'pending' | 'completed';
export type DayStatus = 'completed' | 'partial' | 'missed' | 'in_progress' | 'upcoming' | 'no_tasks';

export const TASK_CATEGORIES: TaskCategory[] = ['Health', 'Study', 'Work', 'Personal', 'Creative', 'Other'];
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface Profile {
  id: string;
  full_name: string;
  age: number | null;
  occupation: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  duration: ChallengeDuration;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Task {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  task_type: TaskType;
  frequency: TaskFrequency | null;
  weekdays: number[];
  scheduled_date: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TaskOccurrence {
  id: string;
  task_id: string;
  challenge_id: string;
  user_id: string;
  challenge_day: number;
  due_date: string;
  title_snapshot: string;
  status: OccurrenceStatus;
  completed_at: string | null;
  created_at: string;
}

export interface NewOccurrence {
  task_id: string;
  challenge_id: string;
  challenge_day: number;
  due_date: string;
  title_snapshot: string;
}
