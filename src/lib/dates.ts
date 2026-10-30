import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDaysToKey(dateKey: string, days: number): string {
  return toDateKey(addDays(parseISO(dateKey), days));
}

export function diffInDays(laterKey: string, earlierKey: string): number {
  return differenceInCalendarDays(parseISO(laterKey), parseISO(earlierKey));
}

export function formatDateKey(dateKey: string, pattern: string): string {
  return format(parseISO(dateKey), pattern);
}

export function weekdayOfKey(dateKey: string): number {
  return parseISO(dateKey).getDay();
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
