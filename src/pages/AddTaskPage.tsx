import type { AppPage } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { TaskForm } from '@/components/tasks/TaskForm';
import type { Workspace } from '@/hooks/useAppData';
import { todayKey } from '@/lib/dates';

interface AddTaskPageProps {
  workspace: Workspace;
  onReload: () => Promise<void>;
  onNavigate: (page: AppPage) => void;
}

export function AddTaskPage({ workspace, onReload, onNavigate }: AddTaskPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Add New Task</h1>
        <p className="text-muted-foreground">
          New tasks start counting on their start date and appear automatically on every day they are due.
        </p>
      </section>

      <Card className="shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <TaskForm
            challenge={workspace.challenge}
            today={todayKey()}
            onSaved={async () => {
              await onReload();
              onNavigate('daily');
            }}
            onCancel={() => onNavigate('daily')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
