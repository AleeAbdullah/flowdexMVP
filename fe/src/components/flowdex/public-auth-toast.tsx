'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { parseAsString, useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import { AUTH_TOASTS } from '@/routes';

export function PublicAuthToast() {
  const router = useRouter();
  const pathname = usePathname();
  const [params, setParams] = useQueryStates({
    auth_toast: parseAsString,
    user_name: parseAsString,
    user_email: parseAsString,
    user_role: parseAsString,
  });
  const toastType = params.auth_toast;
  const userName = params.user_name;
  const userEmail = params.user_email;
  const userRole = params.user_role;
  const userLabel = userName || userEmail || 'unknown';
  const roleSuffix = userRole ? ` (${userRole})` : '';
  const description = `Signed-in user: ${userLabel}${roleSuffix}. Redirected to public page.`;

  useEffect(() => {
    if (toastType !== AUTH_TOASTS.BACKEND_UNREACHABLE) {
      return;
    }

    toast.error('App backend is unavailable', {
      description,
      id: 'auth-backend-unreachable',
    });

    void setParams({
      auth_toast: null,
      user_name: null,
      user_email: null,
      user_role: null,
    });
    router.replace(pathname, { scroll: false });
  }, [description, pathname, router, setParams, toastType]);

  if (toastType !== AUTH_TOASTS.BACKEND_UNREACHABLE) {
    return null;
  }

  return (
    <div className="sr-only" aria-live="polite">
      App backend is unavailable. {description}
    </div>
  );
}
