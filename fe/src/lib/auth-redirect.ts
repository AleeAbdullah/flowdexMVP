export function sanitizeAppRedirectPath(value: string | null | undefined): string {
  if (!value) {
    return '/app';
  }

  const trimmed = value.trim();

  if (!(trimmed === '/app' || trimmed.startsWith('/app/'))) {
    return '/app';
  }

  if (trimmed.startsWith('//')) {
    return '/app';
  }

  try {
    const url = new URL(trimmed, 'https://flowdex.local');
    const pathname = url.pathname;

    if (!(pathname === '/app' || pathname.startsWith('/app/'))) {
      return '/app';
    }

    if (pathname.includes('//')) {
      return '/app';
    }

    return pathname;
  } catch {
    return '/app';
  }
}
