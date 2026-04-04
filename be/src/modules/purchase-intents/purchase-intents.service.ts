import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { IntentStatus } from '../../common/enums/domain.enums';
import { compareFixed, divideFixed, multiplyFixed, normalizeFixed } from '../../common/utils/decimal';
import { UsersService } from '../users/users.service';
import { PresaleService } from '../presale/presale.service';
import { PricingService } from '../pricing/pricing.service';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { PurchaseIntentEntity } from './entities/purchase-intent.entity';

@Injectable()
export class PurchaseIntentsService {
  private readonly logger = new Logger(PurchaseIntentsService.name);

  constructor(
    @InjectRepository(PurchaseIntentEntity)
    private readonly purchaseIntentsRepository: Repository<PurchaseIntentEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    private readonly usersService: UsersService,
    private readonly pricingService: PricingService,
    private readonly presaleService: PresaleService,
  ) {}

  async create(
    auth: AuthContext,
    walletId: string,
    assetCode: string,
    paymentAmount: string,
  ): Promise<{
    intentId: string;
    paymentAddress: string;
    assetCode: string;
    paymentAmount: string;
    assetUsdPrice: string;
    tokenPriceUsd: string;
    tokensAllocatedPreview: string;
    expiresAt: Date;
    currentTier: number;
  }> {
    await this.usersService.syncAndRequireActive(auth);

    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, userId: auth.sub },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const asset = await this.pricingService.getSupportedAssetByCode(assetCode);
    if (!asset) {
      throw new NotFoundException('Supported asset not found');
    }

    const price = await this.pricingService.getPriceByAssetId(asset.id);
    if (!price) {
      throw new BadRequestException('Asset price is not available');
    }

    if (!this.pricingService.isPriceFresh(price)) {
      throw new BadRequestException('Asset price is stale and cannot be used for a purchase intent');
    }

    const tier = await this.presaleService.getCurrentTier();

    if (compareFixed(paymentAmount, asset.minAmount) < 0) {
      throw new BadRequestException('Payment amount is below the minimum supported amount');
    }

    const tokensAllocatedPreview = divideFixed(
      multiplyFixed(paymentAmount, price.priceUsd),
      tier.tokenPriceUsd,
    );
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const intent = await this.purchaseIntentsRepository.save(
      this.purchaseIntentsRepository.create({
        userId: auth.sub,
        walletId,
        assetId: asset.id,
        paymentAddress: asset.treasuryAddress,
        expectedAmount: paymentAmount,
        quotedAssetPriceUsd: price.priceUsd,
        quotedTokenPriceUsd: tier.tokenPriceUsd,
        expectedTokensReal: tokensAllocatedPreview,
        status: IntentStatus.PENDING,
        expiresAt,
        failureReason: null,
      }),
    );

    this.logger.log(
      `Created purchase intent ${intent.id} for user ${auth.sub} using ${asset.assetCode} from wallet ${walletId}.`,
    );

    return {
      intentId: intent.id,
      paymentAddress: intent.paymentAddress,
      assetCode: asset.assetCode,
      paymentAmount: normalizeFixed(paymentAmount),
      assetUsdPrice: normalizeFixed(price.priceUsd),
      tokenPriceUsd: normalizeFixed(tier.tokenPriceUsd),
      tokensAllocatedPreview,
      expiresAt,
      currentTier: tier.sortOrder,
    };
  }

  async reportTx(auth: AuthContext, intentId: string, txHash: string): Promise<{ accepted: true }> {
    await this.usersService.syncAndRequireActive(auth);

    const intent = await this.purchaseIntentsRepository.findOne({
      where: { id: intentId, userId: auth.sub },
    });

    if (!intent) {
      throw new NotFoundException('Purchase intent not found');
    }

    if (!txHash.trim()) {
      throw new BadRequestException('Transaction hash is required');
    }

    if ([IntentStatus.CONFIRMED, IntentStatus.EXPIRED, IntentStatus.REFUNDED].includes(intent.status)) {
      throw new BadRequestException('Transaction hashes can only be reported for active purchase intents');
    }

    if (intent.status === IntentStatus.FAILED) {
      intent.status = IntentStatus.PENDING;
      intent.matchedBlockchainTxId = null;
    }

    intent.reportedTxHash = txHash.trim();
    intent.failureReason = null;
    await this.purchaseIntentsRepository.save(intent);
    this.logger.log(`Recorded reported tx hash for intent ${intent.id}.`);

    return { accepted: true };
  }
}
