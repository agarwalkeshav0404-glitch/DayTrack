import { useMemo, useState } from 'react';
import { parseISO, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DayTaskList } from '@/components/tasks/DayTaskList';
import { MonthCalendar } from '@/components/progress/MonthCalendar';
import type { Workspace } from '@/hooks/useAppData';
import { useOccurrenceToggle } from '@/hooks/useOccurrenceToggle';
import { formatDateKey, todayKey } from '@/lib/dates';
import { buildDayRows, buildDaySummaries, computeTaskTotals } from '@/lib/progress';

interface MonthlyProgressPageProps {
  workspace: Workspace;
  onReload: () => Promise<void>;
}

function clampKey(dateKey: string, start: string, end: string): string {
  if (dateKey < start) return start;
  if (dateKey > end) return end;
  return dateKey;
}

export function MonthlyProgressPage({ workspace, onReload }: MonthlyProgressPageProps) {
  const { challenge, tasks, occurrences } = workspace;
  const today = todayKey();
  const initialKey = clampKey(today, challenge.start_date, challenge.end_date);

  const [month, setMonth] = useState(() => parseISO(initialKey));
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const { toggle, pendingIds } = useOccurrenceToggle(onReload);

  const summaries = useMemo(
    () => buildDaySummaries(challenge, occurrences, today),
    [challenge, occurrences, today],
  );

  const monthPrefix = format(month, 'yyyy-MM');
  const monthSummaries = summaries.filter((summary) => summary.dateKey.startsWith(monthPrefix));
  const countStatus = (status: string) => monthSummaries.filter((summary) => summary.status === status).length;
  const { completed: tasksDone, total: tasksTotal, percent: completionPercent } = computeTaskTotals(monthSummaries);

  const selectedRows = useMemo(
    () => buildDayRows(selectedKey, tasks, occurrences, today),
    [selectedKey, tasks, occurrences, today],
  );
  const isToday = selectedKey === today;
  const isFuture = selectedKey > today;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Monthly progress</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">See your month at a glance</h1>
        <p className="text-muted-foreground">Select any day to review the tasks you planned for it.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-sm lg:col-span-3">
          <CardContent className="pt-6">
            <MonthCalendar
              challenge={challenge}
              summaries={summaries}
              today={today}
              month={month}
              selectedKey={selectedKey}
              onMonthChange={setMonth}
              onSelect={setSelectedKey}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{format(month, 'MMMM')} overview</CardTitle>
              <CardDescription>Days counted up to today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Completed', value: countStatus('completed') },
                  { label: 'Partial', value: countStatus('partial') },
                  { label: 'Missed', value: countStatus('missed') },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border bg-card px-3 py-3">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tasks completed</span>
                  <span className="font-medium tabular-nums">
                    {tasksDone} of {tasksTotal} ({completionPercent}%)
                  </span>
                </div>
                <Progress value={completionPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{formatDateKey(selectedKey, 'EEEE, MMMM d')}</CardTitle>
              <CardDescription>
                {isToday
                  ? 'You can update today’s tasks.'
                  : isFuture
                    ? 'These tasks are scheduled for an upcoming day.'
                    : 'Past days are read-only.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DayTaskList
                rows={selectedRows}
                pendingIds={pendingIds}
                onToggle={toggle}
                emptyMessage="No tasks were scheduled for this day."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
