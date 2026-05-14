'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from '@/icons';
import { AuthErrorBanner } from './auth/auth-error-banner';
import { AuthFields } from './auth/auth-fields';
import { AuthFormShell } from './auth/auth-form-shell';
import type { AuthMode } from './auth/auth-form.types';
import { AuthTrustPanel } from './auth/auth-trust-panel';
import { useAuthFormController } from './auth/use-auth-form-controller';

export function AuthForm(props: {
  mode: AuthMode;
  nextPath: string;
  initialError?: string | null;
}) {
  const controller = useAuthFormController({
    mode: props.mode,
    nextPath: props.nextPath,
    initialError: props.initialError,
  });

  const shellCopy = {
    badge: 'Admin Login',
    title: 'Sign in to admin operations.',
    description: 'This route is reserved for FlowDex admins. Contributor activity now uses wallet verification on the public buy and transaction pages.',
    submitLabel: 'Continue to admin',
  };

  return (
    <AuthFormShell
      badge={shellCopy.badge}
      title={shellCopy.title}
      description={shellCopy.description}
    >
      <form ref={controller.formRef} className="space-y-4" onSubmit={controller.handleSubmit} noValidate>
        <AuthFields
          mode={props.mode}
          values={controller.values}
          fieldErrors={controller.fieldErrors}
          onDisplayNameChange={controller.setDisplayName}
          onEmailChange={controller.setEmail}
          onPasswordChange={controller.setPassword}
        />

        {controller.formError ? <AuthErrorBanner message={controller.formError} /> : null}

        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={controller.isPending}>
          {controller.isPending ? 'Working…' : shellCopy.submitLabel}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Button>
      </form>
      <AuthTrustPanel />
    </AuthFormShell>
  );
}
