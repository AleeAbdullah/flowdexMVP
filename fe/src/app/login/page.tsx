import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/flowdex/auth-form';
import { AUTH_MODES } from '@/components/flowdex/auth/auth-form.types';
import {
  type AuthPageSearchParams,
  resolveAuthenticatedAuthPageRedirect,
  resolveAuthPageInitialError,
  resolveAuthPageNextPath,
} from '@/lib/auth-page';
import { getOptionalSession } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Admin Login | FlowDex',
  description: 'Admin-only sign in for FlowDex operational access.',
};

export default async function LoginPage(props: {
  searchParams: Promise<AuthPageSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const session = await getOptionalSession();
  const initialError = resolveAuthPageInitialError(searchParams);
  const nextPath = resolveAuthPageNextPath(searchParams);

  if (session && !initialError) {
    redirect(resolveAuthenticatedAuthPageRedirect(searchParams));
  }

  return <AuthForm mode={AUTH_MODES.LOGIN} nextPath={nextPath} initialError={initialError} />;
}
