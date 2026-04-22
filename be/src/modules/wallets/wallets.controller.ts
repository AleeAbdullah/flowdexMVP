import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { LinkWalletDto, WalletDto } from './dto/wallets.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('link')
  link(
    @CurrentAuth() auth: AuthContext,
    @Body() body: LinkWalletDto,
  ): Promise<WalletDto> {
    return this.walletsService.link(auth, body);
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
      items: await this.walletsService.listForActiveUser(auth),
    };
  }

  @Delete(':id')
  async remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string): Promise<{ deleted: true }> {
    await this.walletsService.removeForAuth(auth, id);
    return { deleted: true };
  }
}
