import type { AppUserRole } from '../auth/auth.types';
import type { ITransactionListItem } from '../transactions/transactions.types';
import type { WalletNetwork } from '../wallets/wallets.types';

export type IDashboardSummary = {
  profile: {
    userId: string;
    email: string;
    role: AppUserRole;
    status: string;
  };
  walletSummary: {
    linkedWalletCount: number;
    primaryWallet: {
      id: string;
      network: WalletNetwork;
      address: string;
      verifiedAt: string | null;
    } | null;
  };
  activeTransactionCount: number;
  confirmedTransactionCount: number;
  totalTrackedVolume: string;
  recentTransactions: ITransactionListItem[];
};
