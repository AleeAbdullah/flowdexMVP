export const APP_USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type AppUserRole = (typeof APP_USER_ROLES)[keyof typeof APP_USER_ROLES];

export type IAuthMe = {
  userId: string;
  email: string;
  role: AppUserRole;
  status: string;
};
