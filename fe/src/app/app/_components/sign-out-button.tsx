'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { API_ROUTES } from '@/api-routes';
import { Button } from '@/components/ui/button';
import { LogOut } from '@/icons';
import { ROUTES } from '@/routes';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      variant="glass"
      size="sm"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);

        try {
          await fetch(API_ROUTES.adminAuth.logout, {
            method: 'POST',
            cache: 'no-store',
            credentials: 'same-origin',
          });
          router.replace(ROUTES.AUTH.LOGIN);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Sign-out failed');
        } finally {
          setIsPending(false);
        }
      }}
    >
      <LogOut className="h-4 w-4" />
      {isPending ? 'Signing out…' : 'Sign Out'}
    </Button>
  );
}
