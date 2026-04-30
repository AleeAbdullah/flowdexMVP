import Link from 'next/link';
import { getLoginRoute, getSignupRoute } from '@/routes';
import { AUTH_MODES, type AuthMode } from './auth-form.types';

export function AuthModeSwitch(props: {
  mode: AuthMode;
  nextPath: string;
}) {
  const isSignup = props.mode === AUTH_MODES.SIGNUP;
  const href = isSignup
    ? getLoginRoute(props.nextPath)
    : getSignupRoute(props.nextPath);

  return (
    <div className="text-sm text-[var(--muted)]">
      {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
      <Link
        href={href}
        className="font-semibold text-[var(--cyan)] hover:text-[var(--text)]"
      >
        {isSignup ? 'Log in here' : 'Create one here'}
      </Link>
    </div>
  );
}
