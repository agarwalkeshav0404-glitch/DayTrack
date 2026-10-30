import { useState } from 'react';
import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { archiveTask } from '@/services/tasks';
import type { Task } from '@/types/database';

interface ArchiveTaskDialogProps {
  task: Task | null;
  today: string;
  onOpenChange: (open: boolean) => void;
  onArchived: () => Promise<void>;
}

export function ArchiveTaskDialog({ task, today, onOpenChange, onArchived }: ArchiveTaskDialogProps) {
  const [saving, setSaving] = useState(false);

  const handleArchive = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await archiveTask(task, today);
      await onArchived();
      toast({ title: 'Task archived', description: `"${task.title}" will stop appearing from tomorrow.` });
      onOpenChange(false);
    } catch {
      toast({
        title: 'Could not archive this task',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={task !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive "{task?.title}"?</DialogTitle>
          <DialogDescription>
            Starting tomorrow this task will no longer be scheduled. Today and every past day keep their
            records exactly as they are, and the archive is logged in your task history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Keep task
          </Button>
          <Button onClick={handleArchive} disabled={saving} className="gap-2">
            <Archive className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Archiving...' : 'Archive task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
