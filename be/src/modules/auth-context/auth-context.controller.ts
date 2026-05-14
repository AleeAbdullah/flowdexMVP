import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { AuthContextService } from './auth-context.service';

@ApiTags('auth')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('auth')
export class AuthContextController {
  constructor(private readonly authContextService: AuthContextService) {}

  @Get('me')
  getMe(@CurrentAuth() auth: AuthContext): Promise<{
    userId: string;
    email: string;
    role: string;
    status: string;
  }> {
    return this.authContextService.getMe(auth);
  }
}
