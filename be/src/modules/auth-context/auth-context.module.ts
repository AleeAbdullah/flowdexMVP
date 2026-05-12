import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AuthContextController } from './auth-context.controller';
import { AuthContextService } from './auth-context.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthContextController],
  providers: [AuthContextService],
})
export class AuthContextModule {}
