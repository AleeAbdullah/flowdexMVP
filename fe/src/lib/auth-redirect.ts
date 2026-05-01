import { ROUTES } from '@/routes';

export function sanitizeAppRedirectPath(value: string | null | undefined): string {
  if (!value) {
    return ROUTES.DASHBOARD.HOME;
  }

  const trimmed = value.trim();

  if (!(trimmed === ROUTES.DASHBOARD.HOME || trimmed.startsWith(`${ROUTES.DASHBOARD.HOME}/`))) {
    return ROUTES.DASHBOARD.HOME;
  }

  if (trimmed.startsWith('//')) {
    return ROUTES.DASHBOARD.HOME;
  }

  try {
    const url = new URL(trimmed, 'https://flowdex.local');
    const pathname = url.pathname;

    if (!(pathname === ROUTES.DASHBOARD.HOME || pathname.startsWith(`${ROUTES.DASHBOARD.HOME}/`))) {
      return ROUTES.DASHBOARD.HOME;
    }

    if (pathname.includes('//')) {
      return ROUTES.DASHBOARD.HOME;
    }

    return pathname;
  } catch {
    return ROUTES.DASHBOARD.HOME;
  }
}

export function resolveAppRedirectPath(value: string | null | undefined): string {
  return sanitizeAppRedirectPath(value);
}

export function shouldPersistAppRedirectPath(value: string): boolean {
  return value !== ROUTES.DASHBOARD.HOME;
}
