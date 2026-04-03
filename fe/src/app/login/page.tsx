import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/flowdex/auth-form';
import { getOptionalSession } from '@/lib/auth-server';

export default async function LoginPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect('/app');
  }

  return <AuthForm mode="login" />;
}
