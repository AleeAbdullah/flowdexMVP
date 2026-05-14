export const AUTH_MODES = {
  LOGIN: 'login',
} as const;

export type AuthMode = (typeof AUTH_MODES)[keyof typeof AUTH_MODES];

export type AuthFieldName = 'displayName' | 'email' | 'password';

export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;
