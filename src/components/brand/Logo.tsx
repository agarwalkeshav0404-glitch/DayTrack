import { CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <CalendarCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      {showWordmark && <span className="text-lg font-semibold tracking-tight">DayTrack</span>}
    </div>
  );
}
