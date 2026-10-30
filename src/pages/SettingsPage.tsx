import { ProfileSettingsCard } from '@/components/settings/ProfileSettingsCard';
import { PasswordSettingsCard } from '@/components/settings/PasswordSettingsCard';
import { DataExportCard } from '@/components/settings/DataExportCard';
import type { Workspace } from '@/hooks/useAppData';

interface SettingsPageProps {
  workspace: Workspace;
  onReload: () => Promise<void>;
}

export function SettingsPage({ workspace, onReload }: SettingsPageProps) {
  const { profile } = workspace;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your account</h1>
        <p className="text-muted-foreground">Update your details, keep your account secure, and take a copy of your data.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSettingsCard profile={profile} onSaved={onReload} />
        <div className="space-y-6">
          <PasswordSettingsCard />
          <DataExportCard userId={profile.id} />
        </div>
      </div>
    </div>
  );
}
