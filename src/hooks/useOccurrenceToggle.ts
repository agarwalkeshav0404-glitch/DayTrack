import { useCallback, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { setOccurrenceCompleted } from '@/services/occurrences';
import type { DayRow } from '@/lib/progress';

export function useOccurrenceToggle(onChanged: () => Promise<void>) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback(
    async (row: DayRow) => {
      if (!row.occurrenceId || !row.canToggle) return;
      const occurrenceId = row.occurrenceId;
      const nextCompleted = row.state !== 'completed';

      setPendingIds((previous) => new Set(previous).add(occurrenceId));
      try {
        await setOccurrenceCompleted(occurrenceId, nextCompleted);
        await onChanged();
      } catch {
        toast({
          title: 'Could not save that change',
          description: 'Check your connection and try again.',
          variant: 'destructive',
        });
      } finally {
        setPendingIds((previous) => {
          const next = new Set(previous);
          next.delete(occurrenceId);
          return next;
        });
      }
    },
    [onChanged],
  );

  return { toggle, pendingIds };
}
