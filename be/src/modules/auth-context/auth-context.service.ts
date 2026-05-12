import { Injectable } from '@nestjs/common';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthContextService {
  constructor(private readonly usersService: UsersService) {}

  async getMe(auth: AuthContext): Promise<{
    userId: string;
    email: string;
    role: string;
    status: string;
  }> {
    const profile = await this.usersService.syncAndRequireActive(auth);

    return {
      userId: auth.sub,
      email: auth.email ?? '',
      role: profile.role,
      status: profile.status,
    };
  }
}
