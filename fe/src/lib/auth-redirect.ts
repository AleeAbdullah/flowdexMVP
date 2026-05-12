import { ROUTES } from '@/routes';

export function sanitizeAppRedirectPath(value: string | null | undefined): string {
  if (!value) {
    return ROUTES.ADMIN.HOME;
  }

  const trimmed = value.trim();

  if (!(trimmed === ROUTES.ADMIN.HOME || trimmed.startsWith(`${ROUTES.ADMIN.HOME}/`))) {
    return ROUTES.ADMIN.HOME;
  }

  if (trimmed.startsWith('//')) {
    return ROUTES.ADMIN.HOME;
  }

  try {
    const url = new URL(trimmed, 'https://flowdex.local');
    const pathname = url.pathname;

    if (!(pathname === ROUTES.ADMIN.HOME || pathname.startsWith(`${ROUTES.ADMIN.HOME}/`))) {
      return ROUTES.ADMIN.HOME;
    }

    if (pathname.includes('//')) {
      return ROUTES.ADMIN.HOME;
    }

    return pathname;
  } catch {
    return ROUTES.ADMIN.HOME;
  }
}

export function resolveAppRedirectPath(value: string | null | undefined): string {
  return sanitizeAppRedirectPath(value);
}

export function shouldPersistAppRedirectPath(value: string): boolean {
  return value !== ROUTES.ADMIN.HOME;
}
