'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/api-routes';
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

type AdminLoginResponse = {
  code?: string;
  message?: string;
  user?: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
};

async function postAdminLogin(email: string, password: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  let response: Response;

  try {
    response = await fetch(API_ROUTES.adminAuth.login, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { ok: false, message: 'We could not reach the server. Try again in a moment.' };
  }

  const payload = (await response.json().catch(() => null)) as AdminLoginResponse | null;

  if (!response.ok) {
    return {
      ok: false,
      message: payload?.message || 'Invalid email or password',
    };
  }

  return { ok: true };
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

    void fetch(API_ROUTES.adminAuth.logout, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
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
      const parsed = loginSchema.safeParse(values);

      if (!parsed.success) {
        setFieldErrors(toFieldErrors(parsed.error));
        return;
      }

      const loginResult = await postAdminLogin(parsed.data.email, parsed.data.password);

      if (!loginResult.ok) {
        setFormError(loginResult.message ?? 'Invalid email or password');
        return;
      }

      try {
        await bootstrapAppSession();
      } catch (error) {
        await fetch(API_ROUTES.adminAuth.logout, {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
        });

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
