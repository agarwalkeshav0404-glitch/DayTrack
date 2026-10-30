import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { updateProfile } from '@/services/profiles';
import type { Profile } from '@/types/database';

interface ProfileSettingsCardProps {
  profile: Profile;
  onSaved: () => Promise<void>;
}

interface ProfileErrors {
  fullName?: string;
  age?: string;
}

export function ProfileSettingsCard({ profile, onSaved }: ProfileSettingsCardProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [age, setAge] = useState(profile.age?.toString() ?? '');
  const [occupation, setOccupation] = useState(profile.occupation ?? '');
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
      await updateProfile(profile.id, {
        full_name: trimmedName,
        age: parsedAge,
        occupation: occupation.trim() || null,
      });
      await onSaved();
      toast({ title: 'Profile saved' });
    } catch {
      toast({
        title: 'Could not save your profile',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
        <CardDescription>How your name appears across DayTrack.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="settings-name">Full name</Label>
            <Input
              id="settings-name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-age">Age</Label>
              <Input
                id="settings-age"
                type="number"
                inputMode="numeric"
                min={5}
                max={120}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                aria-invalid={Boolean(errors.age)}
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-occupation">Occupation</Label>
              <Input
                id="settings-occupation"
                value={occupation}
                onChange={(event) => setOccupation(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
