import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { describeAuthError, signInWithEmail, signUpWithEmail } from '@/services/auth';
import { validateEmail, validatePassword } from '@/lib/validation';

export type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onBack: () => void;
}

interface AuthErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export function AuthPage({ mode, onModeChange, onBack }: AuthPageProps) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: AuthMode) => {
    setErrors({});
    onModeChange(next);
  };

  const validate = (): AuthErrors => {
    const next: AuthErrors = {};
    const emailError = validateEmail(email.trim());
    if (emailError) next.email = emailError;
    if (isSignup) {
      const passwordError = validatePassword(password);
      if (passwordError) next.password = passwordError;
      if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    } else if (!password) {
      next.password = 'Enter your password.';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      if (isSignup) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error) {
      setErrors({ form: describeAuthError(error) });
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignup ? 'Start your DayTrack journey in under a minute.' : 'Log in to continue your challenge.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8" noValidate>
            {errors.form && (
              <Alert variant="destructive">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="auth-confirm">Confirm password</Label>
                <Input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : 'New to DayTrack?'}{' '}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
            >
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
