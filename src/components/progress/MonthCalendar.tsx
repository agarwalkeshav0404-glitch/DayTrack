import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toDateKey } from '@/lib/dates';
import type { DaySummary } from '@/lib/progress';
import type { Challenge, DayStatus } from '@/types/database';

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<DayStatus, { cell: string; label: string }> = {
  completed: { cell: 'border-emerald-200 bg-emerald-50 text-emerald-800', label: 'Completed' },
  partial: { cell: 'border-amber-200 bg-amber-50 text-amber-800', label: 'Partially done' },
  missed: { cell: 'border-rose-200 bg-rose-50 text-rose-700', label: 'Missed' },
  in_progress: { cell: 'border-primary/40 bg-primary/5 text-primary', label: 'In progress' },
  no_tasks: { cell: 'border-border bg-muted/40 text-muted-foreground', label: 'No tasks' },
  upcoming: { cell: 'border-dashed border-border bg-card text-muted-foreground', label: 'Upcoming' },
};

export const CALENDAR_LEGEND: { status: DayStatus; label: string }[] = [
  { status: 'completed', label: 'Completed' },
  { status: 'partial', label: 'Partial' },
  { status: 'missed', label: 'Missed' },
  { status: 'in_progress', label: 'Today' },
];

interface MonthCalendarProps {
  challenge: Challenge;
  summaries: DaySummary[];
  today: string;
  month: Date;
  selectedKey: string;
  onMonthChange: (next: Date) => void;
  onSelect: (dateKey: string) => void;
}

export function MonthCalendar({
  challenge,
  summaries,
  today,
  month,
  selectedKey,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const summaryByDate = new Map(summaries.map((summary) => [summary.dateKey, summary] as const));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const previousMonthEnd = toDateKey(endOfMonth(addMonths(month, -1)));
  const nextMonthStart = toDateKey(startOfMonth(addMonths(month, 1)));
  const canGoPrevious = previousMonthEnd >= challenge.start_date;
  const canGoNext = nextMonthStart <= challenge.end_date;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous month"
          disabled={!canGoPrevious}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(month, 'MMMM yyyy')}</h2>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_HEADERS.map((weekday) => (
          <div key={weekday} className="py-1">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const inChallenge = dateKey >= challenge.start_date && dateKey <= challenge.end_date;
          const inMonth = isSameMonth(day, month);
          const status: DayStatus | null = !inChallenge
            ? null
            : dateKey > today
              ? 'upcoming'
              : (summaryByDate.get(dateKey)?.status ?? 'no_tasks');
          const selected = dateKey === selectedKey;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!inChallenge}
              onClick={() => onSelect(dateKey)}
              aria-label={
                status ? `${format(day, 'MMMM d')}, ${STATUS_STYLES[status].label}` : format(day, 'MMMM d')
              }
              aria-pressed={selected}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                status ? STATUS_STYLES[status].cell : 'border-transparent text-muted-foreground/40',
                !inMonth && 'opacity-40',
                inChallenge && 'hover:-translate-y-0.5 hover:shadow-sm',
                selected && 'ring-2 ring-primary ring-offset-2',
                dateKey === today && 'font-bold',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground">
        {CALENDAR_LEGEND.map(({ status, label }) => (
          <span key={status} className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded border', STATUS_STYLES[status].cell)} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
