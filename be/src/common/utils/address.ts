import { isAddress } from 'ethers';

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function assertEvmAddress(address: string): string {
  const normalized = normalizeAddress(address);
  if (!isAddress(normalized)) {
    throw new Error('Invalid EVM address');
  }
  return normalized;
}
