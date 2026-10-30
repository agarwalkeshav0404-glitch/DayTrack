import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { toast } from '@/hooks/use-toast';
import { createProfile } from '@/services/profiles';

interface ProfileSetupPageProps {
  userId: string;
  onSaved: () => Promise<void>;
}

interface ProfileErrors {
  fullName?: string;
  age?: string;
}

export function ProfileSetupPage({ userId, onSaved }: ProfileSetupPageProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: ProfileErrors = {};
    const trimmedName = fullName.trim();
    const parsedAge = age.trim() === '' ? null : Number(age);

    if (!trimmedName) next.fullName = 'Enter your full name.';
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 5 || parsedAge > 120)) {
      next.age = 'Enter an age between 5 and 120.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createProfile(userId, {
        full_name: trimmedName,
        age: parsedAge,
        occupation: occupation.trim() || null,
      });
      await onSaved();
    } catch {
      toast({
        title: 'Could not save your profile',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Step 1 of 2</p>
            <h1 className="text-3xl font-semibold tracking-tight">Tell us about you</h1>
            <p className="text-muted-foreground">This personalizes your dashboard. You can update it later in Settings.</p>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Your profile</CardTitle>
              <CardDescription>Only your name is required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full name</Label>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-age">Age</Label>
                    <Input
                      id="profile-age"
                      type="number"
                      inputMode="numeric"
                      min={5}
                      max={120}
                      placeholder="30"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      aria-invalid={Boolean(errors.age)}
                    />
                    {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-occupation">Occupation</Label>
                    <Input
                      id="profile-occupation"
                      placeholder="Software engineer"
                      value={occupation}
                      onChange={(event) => setOccupation(event.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {saving ? 'Saving...' : 'Continue to challenges'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
