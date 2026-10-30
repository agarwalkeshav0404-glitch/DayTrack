import { ArrowRight, CalendarRange, Flame, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

const HERO_IMAGE =
  'https://images.pexels.com/photos/14807516/pexels-photo-14807516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const HIGHLIGHTS = [
  { icon: ListChecks, text: 'Recurring and scheduled tasks that fill your days automatically' },
  { icon: Flame, text: 'Streaks and daily progress that update the moment you check a box' },
  { icon: CalendarRange, text: 'A locked, honest record of every day of your challenge' },
];

interface WelcomePageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function WelcomePage({ onGetStarted, onLogin }: WelcomePageProps) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-12 px-6 py-8 sm:px-12 lg:px-16 lg:py-12">
        <Logo />

        <div className="max-w-xl space-y-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">30 and 101-day challenges</p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Build Consistency. Track Every Day. Complete Your Challenge.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              DayTrack turns your goals into a daily plan. Schedule recurring habits and one-off tasks, check them
              off as you go, and watch your consistency build into real results.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2" onClick={onGetStarted}>
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLogin}>
              I already have an account
            </Button>
          </div>

          <ul className="space-y-4 border-t pt-8">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">Your progress is saved to your account and works on any device.</p>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={HERO_IMAGE}
          alt="A planner, coffee and notebook arranged on a desk for a focused morning"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
      </div>
    </div>
  );
}
