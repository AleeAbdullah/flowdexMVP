'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

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
        await authClient.signOut();
        router.replace('/');
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" />
      {isPending ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
