import { Controller, Delete, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import {
  CreateWalletChallengeDto,
  VerifyWalletSignatureDto,
  WalletDto,
} from './dto/wallets.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('challenge')
  createChallenge(
    @CurrentAuth() auth: AuthContext,
    @Body() body: CreateWalletChallengeDto,
  ): Promise<{ challengeId: string; message: string; expiresAt: Date }> {
    return this.walletsService.createChallenge(auth, body.chain, body.address);
  }

  @Post('verify')
  verify(
    @CurrentAuth() auth: AuthContext,
    @Body() body: VerifyWalletSignatureDto,
  ): Promise<WalletDto> {
    return this.walletsService.verify(auth, body.challengeId, body.signature);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        items: [],
      },
    },
  })
  async list(@CurrentAuth() auth: AuthContext): Promise<{ items: WalletDto[] }> {
    return {
      items: await this.walletsService.listForUser(auth.sub),
    };
  }

  @Delete(':id')
  async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string): Promise<{ deleted: true }> {
    await this.walletsService.removeForUser(auth.sub, id);
    return { deleted: true };
  }
}
