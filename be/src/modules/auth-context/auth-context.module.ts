import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthAccountEntity, AuthUserEntity } from '../../infrastructure/database/entities/auth.entities';
import { UsersModule } from '../users/users.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AuthContextController } from './auth-context.controller';
import { AuthContextService } from './auth-context.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthUserEntity, AuthAccountEntity]),
    UsersModule,
  ],
  controllers: [AuthContextController, AdminAuthController],
  providers: [AuthContextService, AdminAuthService],
})
export class AuthContextModule {}
