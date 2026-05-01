export const APP_USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type AppUserRole = (typeof APP_USER_ROLES)[keyof typeof APP_USER_ROLES];

import type { IWallet } from '../wallets/wallets.types';

export type IAuthMe = {
  userId: string;
  email: string;
  role: AppUserRole;
  status: string;
  wallets: IWallet[];
};
