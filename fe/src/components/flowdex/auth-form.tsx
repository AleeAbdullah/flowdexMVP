'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from '@/icons';
import { AuthErrorBanner } from './auth/auth-error-banner';
import { AuthFields } from './auth/auth-fields';
import { AuthFormShell } from './auth/auth-form-shell';
import type { AuthMode } from './auth/auth-form.types';
import { AuthModeSwitch } from './auth/auth-mode-switch';
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

  const shellCopy = controller.isSignup
    ? {
        badge: 'Create Account',
        title: 'Create your FlowDex account.',
        description: 'Set up your account first, then continue into the protected app to manage wallets and account actions.',
        submitLabel: 'Create account',
      }
    : {
        badge: 'Sign In',
        title: 'Sign in to continue.',
        description: 'Resume your protected FlowDex session and return to the app surface tied to your account access.',
        submitLabel: 'Continue to app',
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
          {controller.isPending ? 'Working...' : shellCopy.submitLabel}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Button>
      </form>

      <AuthTrustPanel />
      <AuthModeSwitch mode={props.mode} nextPath={props.nextPath} />
    </AuthFormShell>
  );
}
