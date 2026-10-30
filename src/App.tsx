import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { useAppData } from '@/hooks/useAppData';
import { useAuthSession } from '@/hooks/useAuthSession';
import { AuthPage, type AuthMode } from '@/pages/AuthPage';
import { ChallengeSetupPage } from '@/pages/ChallengeSetupPage';
import { ProfileSetupPage } from '@/pages/ProfileSetupPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { signOutUser } from '@/services/auth';

type EntryView = 'welcome' | AuthMode;

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

export default function App() {
  const { session, loading: sessionLoading } = useAuthSession();
  const userId = session?.user.id ?? null;
  const appData = useAppData(userId);
  const [entryView, setEntryView] = useState<EntryView>('welcome');

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setEntryView('welcome');
    } catch {
      toast({
        title: 'Could not log out',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  const renderScreen = () => {
    if (sessionLoading) return <FullScreenLoader />;

    if (!userId) {
      if (entryView === 'welcome') {
        return (
          <WelcomePage
            onGetStarted={() => setEntryView('signup')}
            onLogin={() => setEntryView('login')}
          />
        );
      }
      return (
        <AuthPage
          mode={entryView}
          onModeChange={setEntryView}
          onBack={() => setEntryView('welcome')}
        />
      );
    }

    if (appData.status === 'error') {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">We could not load your DayTrack data</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Check your connection, then try again. Your progress is safe.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => void appData.reload()}>Try again</Button>
            <Button variant="outline" onClick={() => void handleSignOut()}>
              Log out
            </Button>
          </div>
        </div>
      );
    }

    if (!appData.data) return <FullScreenLoader />;

    const { profile, challenge, tasks, occurrences } = appData.data;

    if (!profile) {
      return <ProfileSetupPage userId={userId} onSaved={appData.reload} />;
    }

    if (!challenge || challenge.status === 'completed') {
      return (
        <ChallengeSetupPage
          previous={challenge}
          firstName={profile.full_name.trim().split(/\s+/)[0]}
          onCreated={appData.reload}
        />
      );
    }

    return (
      <AppShell
        workspace={{ profile, challenge, tasks, occurrences }}
        onReload={appData.reload}
        onSignOut={() => void handleSignOut()}
      />
    );
  };

  return (
    <>
      {renderScreen()}
      <Toaster />
    </>
  );
}
