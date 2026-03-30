import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthContextController } from './auth-context.controller';
import { AuthContextService } from './auth-context.service';

@Module({
  imports: [UsersModule, WalletsModule],
  controllers: [AuthContextController],
  providers: [AuthContextService],
})
export class AuthContextModule {}
