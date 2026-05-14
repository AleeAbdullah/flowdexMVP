import { resolveAppRedirectPath } from '@/lib/auth-redirect';

export const AUTH_PAGE_ERROR_CODES = {
  ACCOUNT_INACTIVE: 'account_inactive',
  ACCOUNT_SETUP_FAILED: 'account_setup_failed',
} as const;

export type AuthPageSearchParams = {
  next?: string;
  auth_error?: string;
};

export function resolveAuthPageNextPath(searchParams: AuthPageSearchParams) {
  return resolveAppRedirectPath(searchParams.next);
}

export function resolveAuthenticatedAuthPageRedirect(searchParams: AuthPageSearchParams) {
  return resolveAuthPageNextPath(searchParams);
}

export function resolveAuthPageInitialError(searchParams: AuthPageSearchParams) {
  if (searchParams.auth_error === AUTH_PAGE_ERROR_CODES.ACCOUNT_INACTIVE) {
    return 'Your admin account is not active yet. Contact support if you believe this is a mistake.';
  }

  if (searchParams.auth_error === AUTH_PAGE_ERROR_CODES.ACCOUNT_SETUP_FAILED) {
    return 'Your admin account could not be prepared for dashboard access. Try again in a moment.';
  }

  return null;
}
