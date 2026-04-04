import 'dotenv/config';
import 'reflect-metadata';

import dataSource from './data-source';
import { Chain } from '../../common/enums/domain.enums';
import { SupportedAssetEntity } from '../../modules/pricing/entities/supported-asset.entity';
import { AssetPriceEntity } from '../../modules/pricing/entities/asset-price.entity';
import { PresaleTierEntity } from '../../modules/presale/entities/presale-tier.entity';
import { PresaleStateEntity } from '../../modules/presale/entities/presale-state.entity';
import { assertRequiredEnv, env } from '../config/env';

const ASSETS: Array<Partial<SupportedAssetEntity>> = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    assetCode: 'ETH',
    chain: Chain.ETH,
    symbol: 'ETH',
    contractAddress: null,
    decimals: 18,
    treasuryAddress: '0x1111111111111111111111111111111111111111',
    minConfirmations: 12,
    minAmount: '0.010000000000000000',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    assetCode: 'USDT_ERC20',
    chain: Chain.ERC20,
    symbol: 'USDT',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    treasuryAddress: '0x2222222222222222222222222222222222222222',
    minConfirmations: 12,
    minAmount: '10.000000000000000000',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    assetCode: 'USDT_TRC20',
    chain: Chain.TRC20,
    symbol: 'USDT',
    contractAddress: 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj',
    decimals: 6,
    treasuryAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    minConfirmations: 20,
    minAmount: '10.000000000000000000',
    isActive: false,
  },
];

const PRICES: Array<Partial<AssetPriceEntity>> = [
  {
    assetId: '00000000-0000-0000-0000-000000000201',
    priceUsd: '3500.000000000000000000',
    source: 'seed',
  },
  {
    assetId: '00000000-0000-0000-0000-000000000202',
    priceUsd: '1.000000000000000000',
    source: 'seed',
  },
  {
    assetId: '00000000-0000-0000-0000-000000000203',
    priceUsd: '1.000000000000000000',
    source: 'seed',
  },
];

const TIERS: Array<Partial<PresaleTierEntity>> = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    sortOrder: 1,
    tokenPriceUsd: '0.001000000000000000',
    tokenCapReal: '1000000.000000000000000000',
    startsAt: null,
    endsAt: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    sortOrder: 2,
    tokenPriceUsd: '0.002000000000000000',
    tokenCapReal: '2500000.000000000000000000',
    startsAt: null,
    endsAt: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    sortOrder: 3,
    tokenPriceUsd: '0.003000000000000000',
    tokenCapReal: '5000000.000000000000000000',
    startsAt: null,
    endsAt: null,
    isActive: true,
  },
];

const PRESALE_STATE: Partial<PresaleStateEntity> = {
  id: '00000000-0000-0000-0000-000000000001',
  currentTierId: '00000000-0000-0000-0000-000000000101',
  totalRaisedUsdReal: '0.000000000000000000',
  totalTokensSoldReal: '0.000000000000000000',
  displayMultiplier: env.presaleDisplayMultiplier,
};

async function seed(): Promise<void> {
  assertRequiredEnv();
  await dataSource.initialize();

  const supportedAssetsRepository = dataSource.getRepository(SupportedAssetEntity);
  const assetPricesRepository = dataSource.getRepository(AssetPriceEntity);
  const presaleTiersRepository = dataSource.getRepository(PresaleTierEntity);
  const presaleStateRepository = dataSource.getRepository(PresaleStateEntity);

  await supportedAssetsRepository.upsert(ASSETS, ['id']);
  await assetPricesRepository.upsert(PRICES, ['assetId']);
  await presaleTiersRepository.upsert(TIERS, ['id']);
  await presaleStateRepository.upsert([PRESALE_STATE], ['id']);

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Development seed completed successfully.');
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Development seed failed.', error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exitCode = 1;
});
