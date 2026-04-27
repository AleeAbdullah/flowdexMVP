import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { verifyMessage } from 'ethers';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { WalletProvider, WalletTrustLevel } from '../../common/enums/domain.enums';
import { assertEvmAddress, normalizeAddress } from '../../common/utils/address';
import { assertNetworkChainPair, chainEnumForNetwork, isSupportedNetwork } from '../../common/utils/network';
import { env } from '../../infrastructure/config/env';
import { LedgerTransactionEntity } from '../transactions/entities/ledger-transaction.entity';
import { UsersService } from '../users/users.service';
import {
  CreateWalletChallengeDto,
  LinkWalletDto,
  WalletChallengeDto,
  WalletDto,
} from './dto/wallets.dto';
import { WalletChallengeEntity } from './entities/wallet-challenge.entity';
import { WalletEntity } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(WalletChallengeEntity)
    private readonly walletChallengesRepository: Repository<WalletChallengeEntity>,
    @InjectRepository(LedgerTransactionEntity)
    private readonly ledgerTransactionsRepository: Repository<LedgerTransactionEntity>,
    private readonly usersService: UsersService,
  ) {}

  async createChallenge(
    auth: AuthContext,
    input: CreateWalletChallengeDto,
    originHeader?: string,
  ): Promise<WalletChallengeDto> {
    await this.usersService.syncAndRequireActive(auth);

    if (input.provider !== WalletProvider.METAMASK) {
      throw new BadRequestException('Wallet challenges are only supported for METAMASK');
    }

    if (!isSupportedNetwork(input.network)) {
      throw new BadRequestException('Unsupported wallet network');
    }
    assertNetworkChainPair(input.network, input.chainId);

    const addressNormalized = this.parseAddress(input.address);
    const existing = await this.walletsRepository.findOne({
      where: { chainId: input.chainId, addressNormalized },
    });
    if (existing && existing.userId !== auth.sub) {
      throw new ConflictException('Wallet address is already linked to another user');
    }

    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const nonce = randomBytes(16).toString('hex');
    const origin = (input.origin?.trim() || originHeader?.trim() || env.appDomain).toLowerCase();
    const message = this.buildChallengeMessage({
      appName: env.appName,
      domain: env.appDomain,
      origin,
      address: addressNormalized,
      chainId: input.chainId,
      network: input.network,
      nonce,
      issuedAt,
      expiresAt,
    });

    const challenge = await this.walletChallengesRepository.save(
      this.walletChallengesRepository.create({
        userId: auth.sub,
        chain: chainEnumForNetwork(input.network),
        addressRaw: addressNormalized,
        provider: WalletProvider.METAMASK,
        network: input.network,
        chainId: input.chainId,
        addressNormalized,
        nonce,
        message,
        issuedAt,
        expiresAt,
      }),
    );

    return {
      challengeId: challenge.id,
      message: challenge.message,
      expiresAt: challenge.expiresAt,
    };
  }

  async link(auth: AuthContext, input: LinkWalletDto): Promise<WalletDto> {
    await this.usersService.syncAndRequireActive(auth);

    if (!isSupportedNetwork(input.network)) {
      throw new BadRequestException('Unsupported wallet network');
    }
    assertNetworkChainPair(input.network, input.chainId);

    const provider = this.resolveProvider(input);
    if (provider === WalletProvider.METAMASK) {
      return this.linkMetaMask(auth, input);
    }

    return this.linkAlchemy(auth, input);
  }

  async listForActiveUser(auth: AuthContext): Promise<WalletDto[]> {
    await this.usersService.syncAndRequireActive(auth);
    return this.listForUser(auth.sub);
  }

  async listForUser(userId: string): Promise<WalletDto[]> {
    const wallets = await this.walletsRepository.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });

    return wallets
      .filter(wallet => wallet.network && isSupportedNetwork(wallet.network))
      .map(wallet => this.toDto(wallet));
  }

  async removeForAuth(auth: AuthContext, walletId: string): Promise<void> {
    await this.usersService.syncAndRequireActive(auth);

    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, userId: auth.sub },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const linkedTransactions = await this.ledgerTransactionsRepository.count({
      where: { walletId: wallet.id },
    });

    if (linkedTransactions > 0) {
      throw new ConflictException('Wallet cannot be removed after linked transaction activity');
    }

    await this.walletsRepository.delete({ id: wallet.id, userId: auth.sub });
    this.logger.log(`Removed wallet ${wallet.id} for user ${auth.sub}.`);
  }

  private async linkAlchemy(auth: AuthContext, input: LinkWalletDto): Promise<WalletDto> {
    const alchemyAccountId = input.alchemyAccountId?.trim();
    const alchemyWalletId = input.alchemyWalletId?.trim();
    if (!alchemyAccountId || !alchemyWalletId) {
      throw new BadRequestException('alchemyAccountId and alchemyWalletId are required');
    }

    const addressNormalized = this.parseAddress(input.address);
    const existingByProviderWallet = await this.walletsRepository.findOne({
      where: { alchemyWalletId },
    });

    if (existingByProviderWallet && existingByProviderWallet.userId !== auth.sub) {
      throw new ConflictException('Alchemy wallet is already linked to another user');
    }

    const existingByAddress = await this.walletsRepository.findOne({
      where: { chainId: input.chainId, addressNormalized },
    });
    if (existingByAddress && existingByAddress.userId !== auth.sub) {
      throw new ConflictException('Wallet address is already linked to another user');
    }

    const hasPrimaryInNetwork = await this.hasPrimaryInNetwork(auth.sub, input.network);
    const target = existingByProviderWallet
      ?? existingByAddress
      ?? this.walletsRepository.create({
        userId: auth.sub,
        chain: chainEnumForNetwork(input.network),
        chainId: input.chainId,
        addressRaw: input.address.trim(),
        addressNormalized,
        isPrimary: !hasPrimaryInNetwork,
      });

    target.userId = auth.sub;
    target.chain = chainEnumForNetwork(input.network);
    target.chainId = input.chainId;
    target.addressRaw = input.address.trim();
    target.addressNormalized = addressNormalized;
    target.network = input.network;
    target.provider = WalletProvider.ALCHEMY_EMBEDDED;
    target.trustLevel = WalletTrustLevel.PROVIDER_ASSERTED;
    target.alchemyAccountId = alchemyAccountId;
    target.alchemyWalletId = alchemyWalletId;
    target.verifiedAt = new Date();
    if (!hasPrimaryInNetwork) {
      target.isPrimary = true;
    }

    const saved = await this.walletsRepository.save(target);
    this.logger.log(`Linked Alchemy wallet ${saved.id} (${saved.network}) for user ${auth.sub}.`);
    return this.toDto(saved);
  }

  private async linkMetaMask(auth: AuthContext, input: LinkWalletDto): Promise<WalletDto> {
    const challengeId = input.challengeId?.trim();
    const signature = input.signature?.trim();
    if (!challengeId || !signature) {
      throw new BadRequestException('challengeId and signature are required for METAMASK');
    }

    const challenge = await this.walletChallengesRepository.findOne({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new BadRequestException('Challenge not found');
    }
    if (challenge.userId !== auth.sub) {
      throw new ConflictException('Challenge does not belong to current user');
    }
    if (challenge.provider !== WalletProvider.METAMASK) {
      throw new BadRequestException('Challenge provider mismatch');
    }
    if (challenge.usedAt) {
      throw new ConflictException('Challenge already used');
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Challenge expired');
    }

    const addressNormalized = this.parseAddress(input.address);
    if (challenge.addressNormalized !== addressNormalized) {
      throw new BadRequestException('Challenge address mismatch');
    }
    if (challenge.network !== input.network) {
      throw new BadRequestException('Challenge network mismatch');
    }
    if (challenge.chainId !== input.chainId) {
      throw new BadRequestException('Challenge chainId mismatch');
    }

    const recoveredAddress = this.parseAddress(verifyMessage(challenge.message, signature));
    if (recoveredAddress !== challenge.addressNormalized) {
      throw new BadRequestException('Signature does not match challenge address');
    }

    const existingByAddress = await this.walletsRepository.findOne({
      where: { chainId: input.chainId, addressNormalized },
    });
    if (existingByAddress && existingByAddress.userId !== auth.sub) {
      throw new ConflictException('Wallet address is already linked to another user');
    }

    const hasPrimaryInNetwork = await this.hasPrimaryInNetwork(auth.sub, input.network);
    const target = existingByAddress ?? this.walletsRepository.create({
      userId: auth.sub,
      chain: chainEnumForNetwork(input.network),
      chainId: input.chainId,
      addressRaw: input.address.trim(),
      addressNormalized,
      isPrimary: !hasPrimaryInNetwork,
    });

    target.userId = auth.sub;
    target.chain = chainEnumForNetwork(input.network);
    target.chainId = input.chainId;
    target.addressRaw = input.address.trim();
    target.addressNormalized = addressNormalized;
    target.network = input.network;
    target.provider = WalletProvider.METAMASK;
    target.trustLevel = WalletTrustLevel.SIGNED;
    target.alchemyAccountId = null;
    target.alchemyWalletId = null;
    target.verifiedAt = new Date();
    if (!hasPrimaryInNetwork) {
      target.isPrimary = true;
    }

    const saved = await this.walletsRepository.save(target);
    challenge.usedAt = new Date();
    await this.walletChallengesRepository.save(challenge);
    this.logger.log(`Linked MetaMask wallet ${saved.id} (${saved.network}) for user ${auth.sub}.`);
    return this.toDto(saved);
  }

  private resolveProvider(input: LinkWalletDto): WalletProvider {
    if (input.provider) {
      return input.provider;
    }
    if (input.challengeId || input.signature) {
      return WalletProvider.METAMASK;
    }
    return WalletProvider.ALCHEMY_EMBEDDED;
  }

  private async hasPrimaryInNetwork(userId: string, network: string): Promise<boolean> {
    return (await this.walletsRepository.count({
      where: { userId, network, isPrimary: true },
    })) > 0;
  }

  private parseAddress(address: string): string {
    try {
      return normalizeAddress(assertEvmAddress(address));
    } catch {
      throw new BadRequestException('Wallet address is invalid');
    }
  }

  private buildChallengeMessage(input: {
    appName: string;
    domain: string;
    origin: string;
    address: string;
    chainId: number;
    network: string;
    nonce: string;
    issuedAt: Date;
    expiresAt: Date;
  }): string {
    return [
      `Link wallet to ${input.appName}`,
      '',
      `App: ${input.appName}`,
      `Domain: ${input.domain}`,
      `Origin: ${input.origin}`,
      `Address: ${input.address}`,
      `Chain ID: ${input.chainId}`,
      `Network: ${input.network}`,
      `Nonce: ${input.nonce}`,
      `Issued At: ${input.issuedAt.toISOString()}`,
      `Expires At: ${input.expiresAt.toISOString()}`,
    ].join('\n');
  }

  private toDto(wallet: WalletEntity): WalletDto {
    return {
      id: wallet.id,
      address: wallet.addressNormalized,
      network: wallet.network ?? 'ETH_SEPOLIA',
      chainId: wallet.chainId,
      provider: wallet.provider ?? WalletProvider.ALCHEMY_EMBEDDED,
      trustLevel: wallet.trustLevel ?? WalletTrustLevel.PROVIDER_ASSERTED,
      alchemyAccountId: wallet.alchemyAccountId ?? '',
      alchemyWalletId: wallet.alchemyWalletId ?? '',
      isPrimary: wallet.isPrimary,
      verifiedAt: wallet.verifiedAt,
    };
  }
}
