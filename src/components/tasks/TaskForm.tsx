import { useState, type FormEvent } from 'react';
import { CalendarDays, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { diffInDays, formatDateKey } from '@/lib/dates';
import { createTask, type NewTaskInput } from '@/services/tasks';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  WEEKDAY_LABELS,
  type Challenge,
  type TaskCategory,
  type TaskFrequency,
  type TaskPriority,
  type TaskType,
} from '@/types/database';

interface FormState {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  taskType: TaskType;
  frequency: TaskFrequency;
  weekdays: number[];
  startDate: string;
  scheduledDate: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

interface TaskFormProps {
  challenge: Challenge;
  today: string;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}

function validateForm(form: FormState, minDate: string, maxDate: string): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = 'Give your task a title.';
  if (form.title.trim().length > 160) errors.title = 'Titles can be up to 160 characters.';
  if (form.description.length > 1000) errors.description = 'Descriptions can be up to 1000 characters.';

  if (form.taskType === 'recurring') {
    if (form.frequency === 'weekly' && form.weekdays.length === 0) {
      errors.weekdays = 'Choose at least one day of the week.';
    }
    if (!form.startDate) errors.startDate = 'Choose when this task starts.';
    else if (form.startDate < minDate || form.startDate > maxDate) {
      errors.startDate = 'Pick a date between today and the end of your challenge.';
    }
  } else {
    if (!form.scheduledDate) errors.scheduledDate = 'Choose a date for this task.';
    else if (form.scheduledDate < minDate || form.scheduledDate > maxDate) {
      errors.scheduledDate = 'Pick a date between today and the end of your challenge.';
    }
  }
  return errors;
}

function buildPayload(form: FormState): NewTaskInput {
  const base = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    category: form.category,
    priority: form.priority,
  };

  if (form.taskType === 'scheduled') {
    return {
      ...base,
      task_type: 'scheduled',
      frequency: null,
      weekdays: [],
      scheduled_date: form.scheduledDate,
      start_date: form.scheduledDate,
    };
  }

  return {
    ...base,
    task_type: 'recurring',
    frequency: form.frequency,
    weekdays: form.frequency === 'weekly' ? [...form.weekdays].sort((a, b) => a - b) : [],
    scheduled_date: null,
    start_date: form.startDate,
  };
}

const TYPE_OPTIONS: { value: TaskType; title: string; description: string; icon: typeof Repeat }[] = [
  { value: 'recurring', title: 'Recurring', description: 'Repeats every day or on chosen weekdays', icon: Repeat },
  { value: 'scheduled', title: 'Scheduled', description: 'Happens once on a specific day', icon: CalendarDays },
];

export function TaskForm({ challenge, today, onSaved, onCancel }: TaskFormProps) {
  const minDate = today > challenge.start_date ? today : challenge.start_date;
  const maxDate = challenge.end_date;

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: 'Personal',
    priority: 'medium',
    taskType: 'recurring',
    frequency: 'daily',
    weekdays: [],
    startDate: minDate,
    scheduledDate: minDate,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const toggleWeekday = (day: number) => {
    const next = form.weekdays.includes(day)
      ? form.weekdays.filter((value) => value !== day)
      : [...form.weekdays, day];
    update('weekdays', next);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(form, minDate, maxDate);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await createTask(challenge.id, buildPayload(form));
      toast({ title: 'Task added', description: 'It will appear on each day it is scheduled.' });
      await onSaved();
    } catch {
      toast({
        title: 'Could not save the task',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scheduledDayNumber = form.scheduledDate ? diffInDays(form.scheduledDate, challenge.start_date) + 1 : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="task-title">Task title</Label>
        <Input
          id="task-title"
          placeholder="e.g. Read 20 pages"
          value={form.title}
          maxLength={160}
          onChange={(event) => update('title', event.target.value)}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description (optional)</Label>
        <Textarea
          id="task-description"
          placeholder="Add any details that help you follow through"
          rows={3}
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(value) => update('category', value as TaskCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(value) => update('priority', value as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority} className="capitalize">
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Task type</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {TYPE_OPTIONS.map(({ value, title, description, icon: Icon }) => {
            const active = form.taskType === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => update('taskType', value)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                  active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/40',
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-muted-foreground">{description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {form.taskType === 'recurring' ? (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <div className="space-y-2">
            <Label>How often</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'daily', label: 'Every day' },
                  { value: 'weekly', label: 'Selected weekdays' },
                ] as const
              ).map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={form.frequency === option.value ? 'default' : 'outline'}
                  aria-pressed={form.frequency === option.value}
                  onClick={() => update('frequency', option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {form.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Days</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_LABELS.map((label, day) => {
                  const selected = form.weekdays.includes(day);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleWeekday(day)}
                      className={cn(
                        'h-10 rounded-lg border text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:border-primary/40',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {errors.weekdays && <p className="text-sm text-destructive">{errors.weekdays}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-start">Starts counting on</Label>
            <Input
              id="task-start"
              type="date"
              min={minDate}
              max={maxDate}
              value={form.startDate}
              onChange={(event) => update('startDate', event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Days before this date are never generated for the task.</p>
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
          <Label htmlFor="task-date">Due date</Label>
          <Input
            id="task-date"
            type="date"
            min={minDate}
            max={maxDate}
            value={form.scheduledDate}
            onChange={(event) => update('scheduledDate', event.target.value)}
          />
          {scheduledDayNumber !== null && form.scheduledDate && (
            <p className="text-xs text-muted-foreground">
              {formatDateKey(form.scheduledDate, 'EEEE, MMM d')} is Day {scheduledDayNumber} of your challenge.
            </p>
          )}
          {errors.scheduledDate && <p className="text-sm text-destructive">{errors.scheduledDate}</p>}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save task'}
        </Button>
      </div>
    </form>
  );
}
