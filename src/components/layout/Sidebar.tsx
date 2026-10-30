import { CalendarDays, History, Home, ListChecks, LogOut, PlusCircle, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';

export type AppPage = 'home' | 'daily' | 'add-task' | 'monthly' | 'history' | 'settings';

const PRIMARY_NAV: { page: AppPage; label: string; icon: LucideIcon }[] = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'daily', label: 'Daily Tasks', icon: ListChecks },
  { page: 'add-task', label: 'Add New Task', icon: PlusCircle },
  { page: 'monthly', label: 'Monthly Progress', icon: CalendarDays },
  { page: 'history', label: 'Challenge History', icon: History },
  { page: 'settings', label: 'Settings', icon: Settings },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface SidebarProps {
  currentPage: AppPage;
  profile: Profile;
  onNavigate: (page: AppPage) => void;
  onSignOut: () => void;
}

export function Sidebar({ currentPage, profile, onNavigate, onSignOut }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {PRIMARY_NAV.map(({ page, label, icon: Icon }) => {
          const active = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}

      </nav>

      <div className="space-y-3 border-t px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(profile.full_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.occupation ?? 'DayTrack member'}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onSignOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </div>
  );
}
