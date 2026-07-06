import {
  PAYMENT_ASSETS,
  PAYMENT_CHAINS,
  PAYMENT_INTENT_STATUSES,
} from '@/dal/app/payments/payments.types';

export const ADMIN_FILTER_ALL_VALUE = '__all__';

export const adminStatusFilterOptions = Object.values(PAYMENT_INTENT_STATUSES).map(status => ({
  value: status,
  label: status,
}));

export const adminChainFilterOptions = Object.values(PAYMENT_CHAINS).map(chain => ({
  value: chain,
  label: chain,
}));

export const adminAssetFilterOptions = Object.values(PAYMENT_ASSETS).map(asset => ({
  value: asset,
  label: asset,
}));

export const ADMIN_FAILED_STATUSES = new Set<string>([
  PAYMENT_INTENT_STATUSES.FAILED,
  PAYMENT_INTENT_STATUSES.EXPIRED,
]);

export const ADMIN_PENDING_STATUSES = new Set<string>([
  PAYMENT_INTENT_STATUSES.WAITING,
  PAYMENT_INTENT_STATUSES.DETECTED,
  PAYMENT_INTENT_STATUSES.CONFIRMING,
]);
