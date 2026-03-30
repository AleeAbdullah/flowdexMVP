import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfileEntity])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
