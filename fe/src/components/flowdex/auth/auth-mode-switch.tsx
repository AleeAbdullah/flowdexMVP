import { getLoginRoute } from '@/routes';
import type { AuthMode } from './auth-form.types';

export function AuthModeSwitch(props: {
  mode: AuthMode;
  nextPath: string;
}) {
  void props.mode;
  void getLoginRoute(props.nextPath);
  return null;
}
