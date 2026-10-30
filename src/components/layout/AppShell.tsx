import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { Sidebar, type AppPage } from '@/components/layout/Sidebar';
import { HomePage } from '@/pages/HomePage';
import { DailyTasksPage } from '@/pages/DailyTasksPage';
import { AddTaskPage } from '@/pages/AddTaskPage';
import { MonthlyProgressPage } from '@/pages/MonthlyProgressPage';
import { ChallengeHistoryPage } from '@/pages/ChallengeHistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import type { Workspace } from '@/hooks/useAppData';

interface AppShellProps {
  workspace: Workspace;
  onReload: () => Promise<void>;
  onSignOut: () => void;
}

export function AppShell({ workspace, onReload, onSignOut }: AppShellProps) {
  const [page, setPage] = useState<AppPage>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (next: AppPage) => {
    setPage(next);
    setDrawerOpen(false);
  };

  const sidebarProps = {
    currentPage: page,
    profile: workspace.profile,
    onNavigate: navigate,
    onSignOut,
  };

  const pageProps = { workspace, onReload, onNavigate: navigate };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <Logo />
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {page === 'home' && <HomePage {...pageProps} />}
          {page === 'daily' && <DailyTasksPage {...pageProps} />}
          {page === 'add-task' && <AddTaskPage {...pageProps} />}
          {page === 'monthly' && <MonthlyProgressPage workspace={workspace} onReload={onReload} />}
          {page === 'history' && <ChallengeHistoryPage />}
          {page === 'settings' && <SettingsPage workspace={workspace} onReload={onReload} />}
        </div>
      </main>
    </div>
  );
}
