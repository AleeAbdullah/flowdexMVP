import { Injectable } from '@nestjs/common';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class AuthContextService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  async getMe(auth: AuthContext): Promise<{
    userId: string;
    email: string;
    role: string;
    status: string;
    wallets: Array<{
      id: string;
      chain: string;
      address: string;
      isPrimary: boolean;
      verifiedAt: Date | null;
    }>;
  }> {
    const profile = await this.usersService.syncProfile(auth);
    const wallets = await this.walletsService.listForUser(auth.sub);

    return {
      userId: auth.sub,
      email: auth.email,
      role: profile.role,
      status: profile.status,
      wallets,
    };
  }
}
