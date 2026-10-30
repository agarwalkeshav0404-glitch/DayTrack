import { useState } from 'react';
import { CalendarCheck2, Flame, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';
import { StartChallengeDialog } from '@/components/challenge/StartChallengeDialog';
import type { Challenge, ChallengeDuration } from '@/types/database';
import { formatDateKey } from '@/lib/dates';

const CHALLENGE_OPTIONS: {
  duration: ChallengeDuration;
  title: string;
  description: string;
  icon: typeof Target;
  accent: string;
}[] = [
  {
    duration: 30,
    title: '30-Day Challenge',
    description: 'A focused month to build a habit from scratch. Short enough to stay sharp, long enough to feel the change.',
    icon: Target,
    accent: 'bg-blue-50 text-blue-700',
  },
  {
    duration: 101,
    title: '101-Day Challenge',
    description: 'A full commitment to lasting change. Ideal for deep routines and the discipline that survives bad days.',
    icon: Trophy,
    accent: 'bg-emerald-50 text-emerald-700',
  },
];

interface ChallengeSetupPageProps {
  previous: Challenge | null;
  firstName: string;
  onCreated: () => Promise<void>;
}

export function ChallengeSetupPage({ previous, firstName, onCreated }: ChallengeSetupPageProps) {
  const [selected, setSelected] = useState<ChallengeDuration | null>(null);
  const finished = previous?.status === 'completed';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-16 pt-4 sm:pt-10">
        <div className="w-full max-w-4xl space-y-10">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {finished ? 'Ready for the next one' : 'Step 2 of 2'}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {finished ? `Great work, ${firstName}.` : `Choose your challenge, ${firstName}`}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {finished && previous
                ? `Your ${previous.duration}-day challenge ended on ${formatDateKey(previous.end_date, 'MMMM d, yyyy')}. Pick your next commitment below.`
                : 'Pick a duration and a start date. Once you confirm, your challenge begins and tasks are locked to protect your history.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {CHALLENGE_OPTIONS.map(({ duration, title, description, icon: Icon, accent }) => (
              <Card key={duration} className="flex flex-col shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed">{description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CalendarCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      {duration} days of daily tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
                      Streaks and monthly progress
                    </li>
                  </ul>
                  <Button className="w-full" onClick={() => setSelected(duration)}>
                    Start Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <StartChallengeDialog duration={selected} onOpenChange={(open) => !open && setSelected(null)} onStarted={onCreated} />
    </div>
  );
}
