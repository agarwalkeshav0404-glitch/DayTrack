import { CalendarRange, Flame, Target, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDateKey } from '@/lib/dates';
import type { ChallengeStats } from '@/lib/progress';
import type { Challenge, ChallengeStatus } from '@/types/database';

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
};

interface ChallengeOverviewCardProps {
  challenge: Challenge;
  stats: ChallengeStats;
}

export function ChallengeOverviewCard({ challenge, stats }: ChallengeOverviewCardProps) {
  const notStarted = stats.dayNumber === 0;

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-900 text-slate-50 shadow-lg">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="border-transparent bg-white/15 text-slate-50 hover:bg-white/15">
                {STATUS_LABELS[challenge.status]}
              </Badge>
              <span className="text-sm text-slate-300">{stats.duration}-Day Challenge</span>
            </div>
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {notStarted ? 'Starts soon' : `Day ${stats.dayNumber} of ${stats.duration}`}
            </p>
            <p className="text-sm text-slate-300">
              {notStarted
                ? `Your first day is ${formatDateKey(challenge.start_date, 'EEEE, MMMM d')}.`
                : `${stats.daysRemaining} ${stats.daysRemaining === 1 ? 'day' : 'days'} left to finish strong.`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            {formatDateKey(challenge.start_date, 'MMM d, yyyy')} – {formatDateKey(challenge.end_date, 'MMM d, yyyy')}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Challenge progress</span>
            <span className="font-semibold tabular-nums">{stats.progressPercent}%</span>
          </div>
          <Progress value={stats.progressPercent} className="h-2.5 bg-white/15 [&>div]:bg-emerald-400" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Completed days</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.completedDays}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Days remaining</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.daysRemaining}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats }: { stats: ChallengeStats }) {
  const items = [
    {
      label: "Today's completion",
      value: `${stats.todayPercent}%`,
      detail: `${stats.todayCompleted} of ${stats.todayTotal} tasks done`,
      icon: Target,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Completed days',
      value: String(stats.completedDays),
      detail: `${stats.partialDays} partial`,
      icon: Trophy,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Missed days',
      value: String(stats.missedDays),
      detail: 'Days with no tasks done',
      icon: CalendarRange,
      tone: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Current streak',
      value: `${stats.currentStreak}`,
      detail: `Best: ${stats.bestStreak} days`,
      icon: Flame,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ label, value, detail, icon: Icon, tone }) => (
        <Card key={label} className="shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="space-y-4 p-5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
