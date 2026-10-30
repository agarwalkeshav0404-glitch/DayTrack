import { useState } from 'react';
import { Archive, Lock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArchiveTaskDialog } from '@/components/tasks/ArchiveTaskDialog';
import { formatDateKey, todayKey } from '@/lib/dates';
import { WEEKDAY_LABELS, type Task } from '@/types/database';

export function describeSchedule(task: Task): string {
  if (task.task_type === 'scheduled') {
    return `On ${formatDateKey(task.scheduled_date ?? task.start_date, 'MMM d, yyyy')}`;
  }
  if (task.frequency === 'daily') return 'Every day';
  return [...task.weekdays]
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_LABELS[day])
    .join(', ');
}

interface TaskLibraryProps {
  tasks: Task[];
  onReload: () => Promise<void>;
  onAddTask: () => void;
}

export function TaskLibrary({ tasks, onReload, onAddTask }: TaskLibraryProps) {
  const [taskToArchive, setTaskToArchive] = useState<Task | null>(null);
  const today = todayKey();

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50/60 shadow-none">
        <CardContent className="flex gap-3 p-4 text-sm text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Tasks are locked for the length of your challenge so your history stays accurate. Tasks can't be
            deleted. Archiving removes a task from future days only, and every past record is kept.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in this challenge
        </p>
        <Button onClick={onAddTask} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add task
        </Button>
      </div>

      <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {tasks.map((task) => {
          const archived = !task.is_active;
          return (
            <li key={task.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{task.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {describeSchedule(task)} · Starts {formatDateKey(task.start_date, 'MMM d')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="font-normal">
                    {task.category}
                  </Badge>
                  <Badge variant="outline" className="font-normal capitalize">
                    {task.priority} priority
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {task.task_type === 'scheduled' ? 'Scheduled' : 'Recurring'}
                  </Badge>
                  {archived && (
                    <Badge variant="secondary" className="font-normal">
                      Archived after {task.end_date ? formatDateKey(task.end_date, 'MMM d') : 'today'}
                    </Badge>
                  )}
                </div>
              </div>
              {!archived && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 self-start sm:self-center"
                  onClick={() => setTaskToArchive(task)}
                >
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Archive
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <ArchiveTaskDialog
        task={taskToArchive}
        today={today}
        onOpenChange={(open) => {
          if (!open) setTaskToArchive(null);
        }}
        onArchived={onReload}
      />
    </div>
  );
}
