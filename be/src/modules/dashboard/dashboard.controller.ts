import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { DashboardSummaryDto } from './dto/dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentAuth() auth: AuthContext): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(auth);
  }
}
