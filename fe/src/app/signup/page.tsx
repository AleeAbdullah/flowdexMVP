import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin Login | FlowDex',
  description: 'User signup is not available. Admin access uses the login route only.',
};

export default function SignupPage() {
  redirect('/login');
}
