import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { IntentStatus } from '../../common/enums/domain.enums';
import { UsersService } from '../users/users.service';
import { PresaleService } from '../presale/presale.service';
import { PricingService } from '../pricing/pricing.service';
import { WalletEntity } from '../wallets/entities/wallet.entity';
import { PurchaseIntentEntity } from './entities/purchase-intent.entity';

@Injectable()
export class PurchaseIntentsService {
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
    await this.usersService.syncProfile(auth);

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

    const tier = await this.presaleService.getCurrentTier();

    if (Number(paymentAmount) < Number(asset.minAmount)) {
      throw new BadRequestException('Payment amount is below the minimum supported amount');
    }

    const tokensAllocatedPreview = this.divide(
      this.multiply(paymentAmount, price.priceUsd),
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
      }),
    );

    return {
      intentId: intent.id,
      paymentAddress: intent.paymentAddress,
      assetCode: asset.assetCode,
      paymentAmount,
      assetUsdPrice: price.priceUsd,
      tokenPriceUsd: tier.tokenPriceUsd,
      tokensAllocatedPreview,
      expiresAt,
      currentTier: tier.sortOrder,
    };
  }

  async reportTx(auth: AuthContext, intentId: string, txHash: string): Promise<{ accepted: true }> {
    const intent = await this.purchaseIntentsRepository.findOne({
      where: { id: intentId, userId: auth.sub },
    });

    if (!intent) {
      throw new NotFoundException('Purchase intent not found');
    }

    intent.reportedTxHash = txHash;
    await this.purchaseIntentsRepository.save(intent);

    return { accepted: true };
  }

  private multiply(left: string, right: string): string {
    return (Number(left) * Number(right)).toFixed(18).replace(/\.?0+$/, '');
  }

  private divide(left: string, right: string): string {
    return (Number(left) / Number(right)).toFixed(18).replace(/\.?0+$/, '');
  }
}
