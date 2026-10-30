import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Loader2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChallengeReportDialog, type ChallengeEntry } from '@/components/history/ChallengeReportDialog';
import { todayKey } from '@/lib/dates';
import { buildDaySummaries, computeChallengeStats, computeTaskTotals } from '@/lib/progress';
import { fetchAllChallenges } from '@/services/challenges';
import { fetchOccurrences } from '@/services/occurrences';
import type { Challenge, ChallengeStatus } from '@/types/database';

const STATUS_LABELS: Record<ChallengeStatus, string> = {
  upcoming: 'Upcoming',
  active: 'In progress',
  completed: 'Completed',
};

async function loadChallengeEntries(): Promise<ChallengeEntry[]> {
  const challenges = await fetchAllChallenges();
  return Promise.all(
    challenges.map(async (challenge: Challenge) => ({
      challenge,
      occurrences: await fetchOccurrences(challenge.id),
    })),
  );
}

export function ChallengeHistoryPage() {
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<ChallengeEntry | null>(null);
  const today = todayKey();

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setEntries(await loadChallengeEntries());
      setStatus('ready');
    } catch (error) {
      console.error('Failed to load challenge history', error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Challenge history</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Every challenge you have taken on</h1>
        <p className="text-muted-foreground">Open any challenge to review its results and a month-by-month breakdown.</p>
      </section>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading history" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">We could not load your challenge history. Check your connection and try again.</p>
          <Button variant="outline" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      {status === 'ready' && entries.length === 0 && (
        <p className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          No challenges yet.
        </p>
      )}

      {status === 'ready' && entries.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {entries.map((entry) => {
            const { challenge, occurrences } = entry;
            const stats = computeChallengeStats(challenge, occurrences, today);
            const totals = computeTaskTotals(buildDaySummaries(challenge, occurrences, today));
            const elapsedDays = stats.dayNumber;
            const completionShare = elapsedDays === 0 ? 0 : Math.round((stats.completedDays / elapsedDays) * 100);

            return (
              <Card key={challenge.id} className="flex flex-col shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{challenge.duration}-day challenge</CardTitle>
                      <CardDescription>
                        {format(parseISO(challenge.start_date), 'MMM d, yyyy')} –{' '}
                        {format(parseISO(challenge.end_date), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge variant={challenge.status === 'completed' ? 'default' : 'secondary'}>
                      {challenge.status === 'completed' && <Trophy className="mr-1 h-3 w-3" aria-hidden="true" />}
                      {STATUS_LABELS[challenge.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Days completed</span>
                      <span className="font-medium tabular-nums">
                        {stats.completedDays} of {elapsedDays} ({completionShare}%)
                      </span>
                    </div>
                    <Progress value={completionShare} className="h-2" />
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-muted/50 px-2 py-3">
                      <dt className="text-xs text-muted-foreground">Best streak</dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">{stats.bestStreak}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/50 px-2 py-3">
                      <dt className="text-xs text-muted-foreground">Missed days</dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">{stats.missedDays}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/50 px-2 py-3">
                      <dt className="text-xs text-muted-foreground">Tasks done</dt>
                      <dd className="mt-1 text-lg font-semibold tabular-nums">{totals.percent}%</dd>
                    </div>
                  </dl>
                  <Button variant="outline" className="mt-auto w-full" onClick={() => setSelected(entry)}>
                    View report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ChallengeReportDialog
        entry={selected}
        today={today}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
