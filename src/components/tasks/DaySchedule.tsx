import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DayTaskList } from '@/components/tasks/DayTaskList';
import { addDaysToKey, diffInDays, formatDateKey } from '@/lib/dates';
import { buildDayRows } from '@/lib/progress';
import { useOccurrenceToggle } from '@/hooks/useOccurrenceToggle';
import type { Challenge, Task, TaskOccurrence } from '@/types/database';

interface DayScheduleProps {
  challenge: Challenge;
  tasks: Task[];
  occurrences: TaskOccurrence[];
  today: string;
  onReload: () => Promise<void>;
}

function clampToChallenge(dateKey: string, challenge: Challenge): string {
  if (dateKey < challenge.start_date) return challenge.start_date;
  if (dateKey > challenge.end_date) return challenge.end_date;
  return dateKey;
}

export function DaySchedule({ challenge, tasks, occurrences, today, onReload }: DayScheduleProps) {
  const [selected, setSelected] = useState(() => clampToChallenge(today, challenge));
  const { toggle, pendingIds } = useOccurrenceToggle(onReload);

  const rows = useMemo(
    () => buildDayRows(selected, tasks, occurrences, today),
    [selected, tasks, occurrences, today],
  );

  const total = rows.length;
  const completed = rows.filter((row) => row.state === 'completed').length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const dayNumber = diffInDays(selected, challenge.start_date) + 1;
  const isToday = selected === today;
  const isFuture = selected > today;

  const dayLabel = isToday ? 'Today' : formatDateKey(selected, 'EEEE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous day"
            disabled={selected <= challenge.start_date}
            onClick={() => setSelected(addDaysToKey(selected, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[10rem] text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Day {dayNumber} of {challenge.duration} · {dayLabel}
            </p>
            <p className="text-base font-semibold">{formatDateKey(selected, 'MMMM d, yyyy')}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next day"
            disabled={selected >= challenge.end_date}
            onClick={() => setSelected(addDaysToKey(selected, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {!isToday && (
          <Button variant="secondary" onClick={() => setSelected(clampToChallenge(today, challenge))}>
            Jump to today
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total tasks', value: total },
          { label: 'Completed', value: completed },
          { label: 'Remaining', value: remaining },
          { label: 'Completion', value: `${percent}%` },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</p>
          </div>
        ))}
      </div>

      <Progress value={percent} className="h-2" />

      {isFuture && (
        <p className="text-sm text-muted-foreground">
          These tasks are scheduled for a future day. You can mark them done once the day arrives.
        </p>
      )}

      <DayTaskList
        rows={rows}
        pendingIds={pendingIds}
        onToggle={toggle}
        emptyMessage={
          isFuture
            ? 'Nothing is scheduled for this day yet.'
            : 'No tasks were scheduled for this day.'
        }
      />
    </div>
  );
}
