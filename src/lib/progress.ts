import type {
  Challenge,
  ChallengeStatus,
  DayStatus,
  NewOccurrence,
  Task,
  TaskCategory,
  TaskOccurrence,
  TaskPriority,
} from '@/types/database';
import { addDaysToKey, diffInDays, weekdayOfKey } from './dates';

export function computeChallengeStatus(startDate: string, endDate: string, today: string): ChallengeStatus {
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'completed';
  return 'active';
}

export function isTaskDueOn(task: Task, dateKey: string): boolean {
  if (dateKey < task.start_date) return false;
  if (task.end_date && dateKey > task.end_date) return false;
  if (task.task_type === 'scheduled') return dateKey === task.scheduled_date;
  if (task.frequency === 'daily') return true;
  return task.weekdays.includes(weekdayOfKey(dateKey));
}

export interface DaySummary {
  dateKey: string;
  status: DayStatus;
  total: number;
  completed: number;
  percent: number;
}

function resolveDayStatus(dateKey: string, total: number, completed: number, today: string): DayStatus {
  if (dateKey > today) return 'upcoming';
  if (total === 0) return 'no_tasks';
  if (completed === total) return 'completed';
  if (dateKey === today) return 'in_progress';
  return completed > 0 ? 'partial' : 'missed';
}

function summarizeDay(dateKey: string, occurrences: TaskOccurrence[], today: string): DaySummary {
  const total = occurrences.length;
  const completed = occurrences.filter((o) => o.status === 'completed').length;
  return {
    dateKey,
    status: resolveDayStatus(dateKey, total, completed, today),
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export type RowState = 'completed' | 'open' | 'missed' | 'upcoming';

export interface DayRow {
  id: string;
  occurrenceId: string | null;
  taskId: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  state: RowState;
  completedAt: string | null;
  canToggle: boolean;
  archived: boolean;
}

export function buildDayRows(
  dateKey: string,
  tasks: Task[],
  occurrences: TaskOccurrence[],
  today: string,
): DayRow[] {
  if (dateKey > today) {
    return tasks
      .filter((task) => isTaskDueOn(task, dateKey))
      .map((task) => ({
        id: task.id,
        occurrenceId: null,
        taskId: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
        state: 'upcoming',
        completedAt: null,
        canToggle: false,
        archived: !task.is_active,
      }));
  }

  const taskById = new Map(tasks.map((task) => [task.id, task] as const));
  return occurrences
    .filter((occurrence) => occurrence.due_date === dateKey)
    .flatMap((occurrence): DayRow[] => {
      const task = taskById.get(occurrence.task_id);
      if (!task) return [];
      const state: RowState =
        occurrence.status === 'completed' ? 'completed' : dateKey === today ? 'open' : 'missed';
      return [
        {
          id: occurrence.id,
          occurrenceId: occurrence.id,
          taskId: task.id,
          title: occurrence.title_snapshot,
          category: task.category,
          priority: task.priority,
          state,
          completedAt: occurrence.completed_at,
          canToggle: dateKey === today,
          archived: !task.is_active,
        },
      ];
    });
}

export interface ChallengeStats {
  duration: number;
  dayNumber: number;
  daysRemaining: number;
  progressPercent: number;
  completedDays: number;
  partialDays: number;
  missedDays: number;
  currentStreak: number;
  bestStreak: number;
  todayTotal: number;
  todayCompleted: number;
  todayPercent: number;
}

function computeCurrentStreak(summaries: DaySummary[]): number {
  let streak = 0;
  for (let index = summaries.length - 1; index >= 0; index--) {
    const { status } = summaries[index];
    if (status === 'completed') {
      streak++;
    } else if (status !== 'in_progress' && status !== 'no_tasks') {
      break;
    }
  }
  return streak;
}

function computeBestStreak(summaries: DaySummary[]): number {
  let best = 0;
  let run = 0;
  for (const { status } of summaries) {
    if (status === 'completed') {
      run++;
      best = Math.max(best, run);
    } else if (status !== 'in_progress' && status !== 'no_tasks') {
      run = 0;
    }
  }
  return best;
}

export function computeTaskTotals(summaries: DaySummary[]): { completed: number; total: number; percent: number } {
  const completed = summaries.reduce((sum, summary) => sum + summary.completed, 0);
  const total = summaries.reduce((sum, summary) => sum + summary.total, 0);
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function buildDaySummaries(
  challenge: Challenge,
  occurrences: TaskOccurrence[],
  today: string,
): DaySummary[] {
  const occurrencesByDate = new Map<string, TaskOccurrence[]>();
  for (const occurrence of occurrences) {
    const list = occurrencesByDate.get(occurrence.due_date);
    if (list) list.push(occurrence);
    else occurrencesByDate.set(occurrence.due_date, [occurrence]);
  }

  const lastDate = today < challenge.end_date ? today : challenge.end_date;
  const summaries: DaySummary[] = [];
  for (let dateKey = challenge.start_date; dateKey <= lastDate; dateKey = addDaysToKey(dateKey, 1)) {
    summaries.push(summarizeDay(dateKey, occurrencesByDate.get(dateKey) ?? [], today));
  }
  return summaries;
}

export function computeChallengeStats(
  challenge: Challenge,
  occurrences: TaskOccurrence[],
  today: string,
): ChallengeStats {
  const summaries = buildDaySummaries(challenge, occurrences, today);

  const count = (status: DayStatus) => summaries.filter((s) => s.status === status).length;
  const dayNumber = Math.min(Math.max(diffInDays(today, challenge.start_date) + 1, 0), challenge.duration);
  const todaySummary = summaries.find((s) => s.dateKey === today);

  return {
    duration: challenge.duration,
    dayNumber,
    daysRemaining: challenge.duration - dayNumber,
    progressPercent: Math.round((dayNumber / challenge.duration) * 100),
    completedDays: count('completed'),
    partialDays: count('partial'),
    missedDays: count('missed'),
    currentStreak: computeCurrentStreak(summaries),
    bestStreak: computeBestStreak(summaries),
    todayTotal: todaySummary?.total ?? 0,
    todayCompleted: todaySummary?.completed ?? 0,
    todayPercent: todaySummary?.percent ?? 0,
  };
}

export function buildMissingOccurrences(
  challenge: Challenge,
  tasks: Task[],
  occurrences: TaskOccurrence[],
  today: string,
): NewOccurrence[] {
  const existing = new Set(occurrences.map((o) => `${o.task_id}|${o.due_date}`));
  const lastDate = today < challenge.end_date ? today : challenge.end_date;
  const rows: NewOccurrence[] = [];

  for (const task of tasks) {
    const from = task.start_date > challenge.start_date ? task.start_date : challenge.start_date;
    const to = task.end_date && task.end_date < lastDate ? task.end_date : lastDate;
    for (let dateKey = from; dateKey <= to; dateKey = addDaysToKey(dateKey, 1)) {
      if (!isTaskDueOn(task, dateKey) || existing.has(`${task.id}|${dateKey}`)) continue;
      rows.push({
        task_id: task.id,
        challenge_id: challenge.id,
        challenge_day: diffInDays(dateKey, challenge.start_date) + 1,
        due_date: dateKey,
        title_snapshot: task.title,
      });
    }
  }

  return rows;
}
