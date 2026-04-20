'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { FlowdexWordmark, GlassPanel } from './primitives';

export function AuthForm(props: {
  mode: 'login' | 'signup';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nextPath = searchParams.get('next') || '/app';

  const isSignup = props.mode === 'signup';

  return (
    <div className="section-shell section-pad flex min-h-screen items-center justify-center">
      <GlassPanel className="w-full max-w-xl p-8 md:p-10">
        <div className="space-y-6">
          <FlowdexWordmark />

          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-1 text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
              {isSignup ? 'Create Session' : 'Sign In'}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text)]">
              {isSignup ? 'Enter the protected FlowDex surface.' : 'Resume your protected FlowDex session.'}
            </h1>
            <p className="text-sm leading-7 text-[var(--muted)]">
              Email-first auth keeps the browser session in the frontend, while the backend only sees a short-lived internal transport token from the BFF.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage(null);

              startTransition(async () => {
                const result = isSignup
                  ? await authClient.signUp.email({
                    email,
                    password,
                    name,
                  })
                  : await authClient.signIn.email({
                    email,
                    password,
                  });

                if (result.error) {
                  setErrorMessage(result.error.message || 'Authentication failed');
                  return;
                }

                router.replace(nextPath);
                router.refresh();
              });
            }}
          >
            {isSignup ? (
              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Display Name</span>
                <Input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="FlowDex operator"
                  className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
                  required
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Email</span>
              <Input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="operator@flowdex.io"
                className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Password</span>
              <Input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
                minLength={8}
                required
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" variant="brand" size="lg" className="w-full" disabled={isPending}>
              {isPending ? 'Working...' : isSignup ? 'Create account' : 'Continue to app'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Mail className="h-4 w-4 text-cyan-300" />
                Email-first access
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Wallet linking happens after login, so the account surface can own chain-specific flows deliberately.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                BFF transport token
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                The browser never sends the Nest internal JWT directly. Next.js signs that token only on the server.
              </p>
            </div>
          </div>

          <div className="text-sm text-[var(--muted)]">
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link
              href={isSignup ? '/login' : '/signup'}
              className="font-semibold text-[var(--cyan)] hover:text-[var(--text)]"
            >
              {isSignup ? 'Log in here' : 'Create one here'}
            </Link>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
