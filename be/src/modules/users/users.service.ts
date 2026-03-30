import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole, UserStatus } from '../../common/enums/domain.enums';
import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly userProfilesRepository: Repository<UserProfileEntity>,
  ) {}

  async syncProfile(auth: AuthContext): Promise<UserProfileEntity> {
    const existing = await this.userProfilesRepository.findOne({
      where: { userId: auth.sub },
    });

    if (existing) {
      if (existing.role !== auth.role) {
        existing.role = auth.role as UserRole;
        return this.userProfilesRepository.save(existing);
      }

      return existing;
    }

    return this.userProfilesRepository.save(
      this.userProfilesRepository.create({
        userId: auth.sub,
        role: (auth.role as UserRole) ?? UserRole.USER,
        status: UserStatus.ACTIVE,
      }),
    );
  }

  async getByUserId(userId: string): Promise<UserProfileEntity | null> {
    return this.userProfilesRepository.findOne({ where: { userId } });
  }
}
