import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DaySchedule } from '@/components/tasks/DaySchedule';
import { TaskLibrary } from '@/components/tasks/TaskLibrary';
import type { AppPage } from '@/components/layout/Sidebar';
import type { Workspace } from '@/hooks/useAppData';
import { todayKey } from '@/lib/dates';

interface DailyTasksPageProps {
  workspace: Workspace;
  onReload: () => Promise<void>;
  onNavigate: (page: AppPage) => void;
}

export function DailyTasksPage({ workspace, onReload, onNavigate }: DailyTasksPageProps) {
  const { challenge, tasks, occurrences } = workspace;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Daily Tasks</h1>
        <p className="text-muted-foreground">Check off what you finished and review every task in your challenge.</p>
      </section>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Day schedule</TabsTrigger>
          <TabsTrigger value="all">All tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <DaySchedule
            challenge={challenge}
            tasks={tasks}
            occurrences={occurrences}
            today={todayKey()}
            onReload={onReload}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <TaskLibrary tasks={tasks} onReload={onReload} onAddTask={() => onNavigate('add-task')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
