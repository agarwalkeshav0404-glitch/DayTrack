import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { addDaysToKey, formatDateKey, todayKey } from '@/lib/dates';
import { createChallenge } from '@/services/challenges';
import type { ChallengeDuration } from '@/types/database';

interface StartChallengeDialogProps {
  duration: ChallengeDuration | null;
  onOpenChange: (open: boolean) => void;
  onStarted: () => Promise<void>;
}

export function StartChallengeDialog({ duration, onOpenChange, onStarted }: StartChallengeDialogProps) {
  const today = todayKey();
  const [startDate, setStartDate] = useState(today);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const endDate = duration ? addDaysToKey(startDate, duration - 1) : startDate;

  const handleConfirm = async () => {
    if (!duration) return;
    if (!startDate || startDate < today) {
      setDateError('Choose today or a future date to start.');
      return;
    }
    setSaving(true);
    try {
      await createChallenge(duration, startDate);
      toast({ title: 'Challenge set up', description: `Your ${duration}-day challenge is ready.` });
      onOpenChange(false);
      await onStarted();
    } catch {
      toast({
        title: 'Could not start the challenge',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={duration !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start your {duration}-day challenge</DialogTitle>
          <DialogDescription>
            Pick the first day of your challenge. The end date is calculated automatically, and tasks are locked
            once it begins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="challenge-start">Start date</Label>
            <Input
              id="challenge-start"
              type="date"
              min={today}
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setDateError(null);
              }}
            />
            {dateError && <p className="text-sm text-destructive">{dateError}</p>}
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="text-muted-foreground">Ends on</p>
            <p className="mt-1 font-semibold">{formatDateKey(endDate, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? 'Starting...' : 'Confirm and start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
