'use client';

import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LandingNewsletterForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();

  function validateEmail(value: string) {
    if (!value.trim()) {
      return 'Enter an email address to receive launch updates.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Enter a valid email address, for example name@example.com.';
    }

    return '';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextError = validateEmail(email);
    if (nextError) {
      setError(nextError);
      inputRef.current?.focus();
      return;
    }

    setError('');
    setIsPending(true);

    await new Promise(resolve => window.setTimeout(resolve, 700));

    setIsPending(false);
    setIsSubscribed(true);
  }

  if (isSubscribed) {
    return (
      <div className="rounded-[1.15rem] border border-[var(--accent-border)] bg-[var(--accent-bg)] p-5 text-left">
        <div className="font-heading text-xl font-bold text-[var(--text)]">Subscribed.</div>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Launch updates will go to {email}.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-3 text-left" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="landing-newsletter-email" className="text-sm font-semibold text-[var(--text)]">
          Email for launch updates
        </label>
        <Input
          ref={inputRef}
          id="landing-newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          inputMode="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          onBlur={() => setError(validateEmail(email))}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hintId}
          placeholder="name@example.com…"
          className="h-12"
        />
        <p id={hintId} className="text-sm leading-6 text-[var(--muted)]">
          Product notes, launch timing, and major public updates.
        </p>
        {error ? (
          <p id={errorId} role="alert" className="text-sm leading-6 text-[var(--status-error-text)]">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? 'Subscribing…' : 'Subscribe'}
      </Button>
    </form>
  );
}
