'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AuthBootstrapError, bootstrapAppSession } from '@/lib/auth-bootstrap';
import { loginSchema } from '@/schemas/auth';
import type { AuthFieldErrors, AuthFieldName, AuthMode } from './auth-form.types';

type AuthValues = {
  displayName: string;
  email: string;
  password: string;
};

function focusFirstInvalidField(form: HTMLFormElement | null, fieldErrors: AuthFieldErrors) {
  if (!form) {
    return;
  }

  const orderedFields: AuthFieldName[] = ['displayName', 'email', 'password'];

  for (const fieldName of orderedFields) {
    if (!fieldErrors[fieldName]) {
      continue;
    }

    const input = form.elements.namedItem(fieldName);
    if (input instanceof HTMLElement) {
      input.focus();
      return;
    }
  }
}

function toFieldErrors(error: unknown): AuthFieldErrors {
  const nextErrors: AuthFieldErrors = {};

  if (!error || typeof error !== 'object' || !('issues' in error)) {
    return nextErrors;
  }

  const issues = (error as { issues?: Array<{ path?: unknown[]; message?: string }> }).issues ?? [];
  for (const issue of issues) {
    const path = Array.isArray(issue.path) ? String(issue.path[0] ?? '') : '';
    if (!path || !issue.message) {
      continue;
    }

    if (path === 'displayName' || path === 'email' || path === 'password') {
      nextErrors[path] = issue.message;
    }
  }

  return nextErrors;
}

function resolveBootstrapErrorMessage(error: AuthBootstrapError) {
  if (error.code === 'USER_ACCOUNT_INACTIVE') {
    return 'Your account is not active yet. Contact support if you believe this is a mistake.';
  }

  if (error.code === 'USER_PROFILE_NOT_FOUND') {
    return 'Your account could not be prepared for app access. Try again in a moment.';
  }

  if (error.code === 'NETWORK_ERROR') {
    return error.message;
  }

  return error.message || 'We could not finish signing you in.';
}

function resolveSignInErrorMessage(message?: string) {
  return message || 'Authentication failed';
}

export function useAuthFormController(props: {
  mode: AuthMode;
  nextPath: string;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(props.initialError ?? null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [values, setValues] = useState<AuthValues>({
    displayName: '',
    email: '',
    password: '',
  });
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!props.initialError) {
      return;
    }

    void authClient.signOut();
  }, [props.initialError]);

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) {
      return;
    }

    focusFirstInvalidField(formRef.current, fieldErrors);
  }, [fieldErrors]);

  const setDisplayName = (value: string) => {
    setValues(current => ({ ...current, displayName: value }));
    setFieldErrors(current => ({ ...current, displayName: undefined }));
  };

  const setEmail = (value: string) => {
    setValues(current => ({ ...current, email: value }));
    setFieldErrors(current => ({ ...current, email: undefined }));
  };

  const setPassword = (value: string) => {
    setValues(current => ({ ...current, password: value }));
    setFieldErrors(current => ({ ...current, password: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await (async () => {
        const parsed = loginSchema.safeParse(values);

        if (!parsed.success) {
          setFieldErrors(toFieldErrors(parsed.error));
          return null;
        }

        return authClient.signIn.email({
          email: parsed.data.email,
          password: parsed.data.password,
        });
      })();

      if (!result) {
        return;
      }

      if (result.error) {
        const signInErrorMessage = resolveSignInErrorMessage(result.error.message);
        const signupResult = await authClient.signUp.email({
          name: values.displayName.trim() || 'FlowDex Admin',
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });

        if (signupResult.error) {
          setFormError(
            signupResult.error.code === 'ADMIN_EMAIL_NOT_ALLOWED'
              ? 'This email is not on the admin allowlist.'
              : signInErrorMessage,
          );
          return;
        }
      }

      try {
        await bootstrapAppSession();
      } catch (error) {
        await authClient.signOut();

        if (error instanceof AuthBootstrapError) {
          setFormError(resolveBootstrapErrorMessage(error));
          return;
        }

        setFormError('We could not finish preparing your account.');
        return;
      }

      router.replace(props.nextPath);
      router.refresh();
    });
  };

  return {
    formRef,
    isPending,
    formError,
    fieldErrors,
    values,
    setDisplayName,
    setEmail,
    setPassword,
    handleSubmit,
  };
}
