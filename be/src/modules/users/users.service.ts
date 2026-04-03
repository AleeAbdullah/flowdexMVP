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
    const role = (auth.role as UserRole) ?? UserRole.USER;

    await this.userProfilesRepository.upsert(
      {
        userId: auth.sub,
        role,
        status: UserStatus.ACTIVE,
      },
      ['userId'],
    );

    const profile = await this.userProfilesRepository.findOne({
      where: { userId: auth.sub },
    });

    if (!profile) {
      throw new Error(`Failed to load profile for ${auth.sub}`);
    }

    if (profile.role !== role) {
      profile.role = role;
      return this.userProfilesRepository.save(profile);
    }

    return profile;
  }

  async getByUserId(userId: string): Promise<UserProfileEntity | null> {
    return this.userProfilesRepository.findOne({ where: { userId } });
  }
}
