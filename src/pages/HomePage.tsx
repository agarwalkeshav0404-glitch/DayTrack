import { useMemo } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChallengeOverviewCard, StatsGrid } from '@/components/home/ChallengeOverviewCard';
import { DayTaskList } from '@/components/tasks/DayTaskList';
import type { AppPage } from '@/components/layout/Sidebar';
import type { Workspace } from '@/hooks/useAppData';
import { useOccurrenceToggle } from '@/hooks/useOccurrenceToggle';
import { formatDateKey, greetingForHour, todayKey } from '@/lib/dates';
import { buildDayRows, computeChallengeStats } from '@/lib/progress';

const MOTIVATIONS = [
  'Small steps done daily beat big plans someday.',
  'Consistency is quiet power. Show up again today.',
  'Progress is built one checked box at a time.',
  'Your future self is counting on what you do today.',
  'Keep the chain going. Starting was the hardest part.',
  'Discipline is choosing what you want most over what you want now.',
];

interface HomePageProps {
  workspace: Workspace;
  onReload: () => Promise<void>;
  onNavigate: (page: AppPage) => void;
}

export function HomePage({ workspace, onReload, onNavigate }: HomePageProps) {
  const { profile, challenge, tasks, occurrences } = workspace;
  const today = todayKey();
  const stats = useMemo(() => computeChallengeStats(challenge, occurrences, today), [challenge, occurrences, today]);
  const todayRows = useMemo(() => buildDayRows(today, tasks, occurrences, today), [today, tasks, occurrences]);
  const { toggle, pendingIds } = useOccurrenceToggle(onReload);

  const firstName = profile.full_name.trim().split(/\s+/)[0];
  const greeting = greetingForHour(new Date().getHours());
  const motivation = MOTIVATIONS[stats.dayNumber % MOTIVATIONS.length];
  const notStarted = stats.dayNumber === 0;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{formatDateKey(today, 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting}, {firstName}
        </h1>
        <p className="text-muted-foreground">{motivation}</p>
      </section>

      <ChallengeOverviewCard challenge={challenge} stats={stats} />

      <StatsGrid stats={stats} />

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">Today's tasks</CardTitle>
              <CardDescription>
                {stats.todayCompleted} of {stats.todayTotal} completed
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('daily')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <DayTaskList
              rows={todayRows}
              pendingIds={pendingIds}
              onToggle={toggle}
              emptyMessage={
                notStarted
                  ? 'Your tasks appear here once the challenge begins.'
                  : 'No tasks are scheduled for today. Add one to get started.'
              }
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Keep your plan up to date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" onClick={() => onNavigate('add-task')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a new task
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onNavigate('daily')}>
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              View all tasks
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
