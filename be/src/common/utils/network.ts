import { BadRequestException } from '@nestjs/common';

import { Chain } from '../enums/domain.enums';

export const NETWORK_CHAIN_IDS = {
  ETH_SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
} as const;

export type AppNetwork = keyof typeof NETWORK_CHAIN_IDS;

export function isSupportedNetwork(network: string): network is AppNetwork {
  return Object.prototype.hasOwnProperty.call(NETWORK_CHAIN_IDS, network);
}

export function chainIdForNetwork(network: string): number {
  if (!isSupportedNetwork(network)) {
    throw new BadRequestException(`Unsupported network ${network}`);
  }
  return NETWORK_CHAIN_IDS[network];
}

export function assertNetworkChainPair(network: string, chainId: number): void {
  if (chainIdForNetwork(network) !== chainId) {
    throw new BadRequestException('network and chainId mismatch');
  }
}

export function chainEnumForNetwork(network: string): Chain {
  if (network === 'BASE_SEPOLIA') {
    return Chain.BASE_SEPOLIA;
  }

  return Chain.ETH_SEPOLIA;
}
