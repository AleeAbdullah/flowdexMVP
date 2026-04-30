'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function PublicAuthToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const toastType = searchParams.get('auth_toast');
    if (toastType !== 'backend_unreachable') {
      return;
    }

    const userName = searchParams.get('user_name');
    const userEmail = searchParams.get('user_email');
    const userRole = searchParams.get('user_role');
    const userLabel = userName || userEmail || 'unknown';
    const roleSuffix = userRole ? ` (${userRole})` : '';

    toast.error('App backend is unavailable', {
      description: `Signed-in user: ${userLabel}${roleSuffix}. Redirected to public page.`,
      id: 'auth-backend-unreachable',
    });

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
