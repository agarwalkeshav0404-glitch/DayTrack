import { format } from 'date-fns';
import { CheckCircle2, CircleDashed, Clock, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { DayRow, RowState } from '@/lib/progress';
import type { TaskPriority } from '@/types/database';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-rose-200 bg-rose-50 text-rose-700',
};

function StateLabel({ row }: { row: DayRow }) {
  const config: Record<RowState, { label: string; className: string; icon: typeof Clock }> = {
    completed: {
      label: row.completedAt ? `Done ${format(new Date(row.completedAt), 'h:mm a')}` : 'Done',
      className: 'text-emerald-700',
      icon: CheckCircle2,
    },
    open: { label: 'To do', className: 'text-muted-foreground', icon: CircleDashed },
    missed: { label: 'Missed', className: 'text-rose-600', icon: Clock },
    upcoming: { label: 'Upcoming', className: 'text-muted-foreground', icon: Clock },
  };
  const { label, className, icon: Icon } = config[row.state];
  return (
    <span className={cn('flex shrink-0 items-center gap-1.5 text-xs font-medium', className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

interface DayTaskListProps {
  rows: DayRow[];
  pendingIds: Set<string>;
  onToggle: (row: DayRow) => void;
  emptyMessage: string;
}

export function DayTaskList({ rows, pendingIds, onToggle, emptyMessage }: DayTaskListProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
        <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const pending = row.occurrenceId !== null && pendingIds.has(row.occurrenceId);
        const disabled = !row.canToggle || pending;
        return (
          <li
            key={row.id}
            className={cn(
              'flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-colors',
              row.state === 'completed' && 'border-emerald-100 bg-emerald-50/40',
              row.state === 'missed' && 'border-rose-100 bg-rose-50/40',
              !disabled && 'hover:border-primary/30',
            )}
          >
            <Checkbox
              checked={row.state === 'completed'}
              disabled={disabled}
              onCheckedChange={() => onToggle(row)}
              aria-label={`Mark ${row.title} as ${row.state === 'completed' ? 'to do' : 'done'}`}
              className="h-5 w-5"
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm font-medium',
                  row.state === 'completed' && 'text-muted-foreground line-through',
                )}
              >
                {row.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {row.category}
                </Badge>
                <Badge variant="outline" className={cn('font-normal capitalize', PRIORITY_STYLES[row.priority])}>
                  {row.priority} priority
                </Badge>
                {row.archived && (
                  <Badge variant="secondary" className="font-normal">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
            <StateLabel row={row} />
          </li>
        );
      })}
    </ul>
  );
}
