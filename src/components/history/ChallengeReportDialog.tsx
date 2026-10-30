import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildDaySummaries, computeChallengeStats, computeTaskTotals, type DaySummary } from '@/lib/progress';
import type { Challenge, TaskOccurrence } from '@/types/database';

export interface ChallengeEntry {
  challenge: Challenge;
  occurrences: TaskOccurrence[];
}

interface MonthBreakdown {
  monthKey: string;
  completed: number;
  partial: number;
  missed: number;
  tasksDone: number;
  tasksTotal: number;
  percent: number;
}

function buildMonthlyBreakdown(summaries: DaySummary[]): MonthBreakdown[] {
  const byMonth = new Map<string, DaySummary[]>();
  for (const summary of summaries) {
    const key = summary.dateKey.slice(0, 7);
    const list = byMonth.get(key);
    if (list) list.push(summary);
    else byMonth.set(key, [summary]);
  }

  return Array.from(byMonth, ([monthKey, days]) => {
    const totals = computeTaskTotals(days);
    return {
      monthKey,
      completed: days.filter((day) => day.status === 'completed').length,
      partial: days.filter((day) => day.status === 'partial').length,
      missed: days.filter((day) => day.status === 'missed').length,
      tasksDone: totals.completed,
      tasksTotal: totals.total,
      percent: totals.percent,
    };
  });
}

interface ChallengeReportDialogProps {
  entry: ChallengeEntry | null;
  today: string;
  onOpenChange: (open: boolean) => void;
}

export function ChallengeReportDialog({ entry, today, onOpenChange }: ChallengeReportDialogProps) {
  const report = useMemo(() => {
    if (!entry) return null;
    const summaries = buildDaySummaries(entry.challenge, entry.occurrences, today);
    return {
      stats: computeChallengeStats(entry.challenge, entry.occurrences, today),
      totals: computeTaskTotals(summaries),
      months: buildMonthlyBreakdown(summaries),
    };
  }, [entry, today]);

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-print-area>
        {entry && report && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{entry.challenge.duration}-day challenge report</DialogTitle>
              <DialogDescription>
                {format(parseISO(entry.challenge.start_date), 'MMMM d, yyyy')} to{' '}
                {format(parseISO(entry.challenge.end_date), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Days completed', value: report.stats.completedDays },
                { label: 'Partial days', value: report.stats.partialDays },
                { label: 'Missed days', value: report.stats.missedDays },
                { label: 'Best streak', value: report.stats.bestStreak },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Overall task completion: <span className="font-medium text-foreground">{report.totals.completed} of {report.totals.total} ({report.totals.percent}%)</span>
            </p>

            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Completed days</TableHead>
                    <TableHead className="text-right">Partial</TableHead>
                    <TableHead className="text-right">Missed</TableHead>
                    <TableHead className="text-right">Tasks done</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.months.map((month) => (
                    <TableRow key={month.monthKey}>
                      <TableCell className="font-medium">{format(parseISO(`${month.monthKey}-01`), 'MMMM yyyy')}</TableCell>
                      <TableCell className="text-right tabular-nums">{month.completed}</TableCell>
                      <TableCell className="text-right tabular-nums">{month.partial}</TableCell>
                      <TableCell className="text-right tabular-nums">{month.missed}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {month.tasksDone} / {month.tasksTotal} ({month.percent}%)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print or save as PDF
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
