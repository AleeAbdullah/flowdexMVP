import { createHash, randomUUID } from 'node:crypto';

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { UserRole } from '../../common/enums/domain.enums';
import { env } from '../../infrastructure/config/env';
import { AuthAccountEntity, AuthUserEntity } from '../../infrastructure/database/entities/auth.entities';
import { UsersService } from '../users/users.service';
import { AdminLoginResponseDto, AdminUserResponseDto } from './dto/admin-login.dto';

const ADMIN_CREDENTIAL_PROVIDER = 'credential';
const ADMIN_PASSWORD_HASH_ROUNDS = 10;

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectRepository(AuthUserEntity)
    private readonly authUsersRepository: Repository<AuthUserEntity>,
    @InjectRepository(AuthAccountEntity)
    private readonly authAccountsRepository: Repository<AuthAccountEntity>,
  ) {}

  async login(email: string, password: string): Promise<AdminLoginResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!this.isAllowedAdminEmail(normalizedEmail)) {
      this.logger.warn('Rejected admin login attempt.');
      throw this.invalidCredentialsError();
    }

    const account = await this.findCredentialAccount(normalizedEmail);
    let passwordVerified = false;

    if (account?.passwordHash) {
      passwordVerified = await this.verifyPassword(password, account.passwordHash);
    } else if (this.canUseLegacyPasswordFallback(normalizedEmail)) {
      passwordVerified = await this.verifyPassword(password, env.adminPasswordHash);

      if (passwordVerified) {
        await this.upsertAdminCredential({
          email: normalizedEmail,
          passwordHash: env.adminPasswordHash,
        });
      }
    }

    // Always run bcrypt once for missing DB credentials when no legacy fallback exists.
    if (!account?.passwordHash && !this.canUseLegacyPasswordFallback(normalizedEmail)) {
      await this.verifyPassword(password, env.adminPasswordHash);
    }

    if (!passwordVerified) {
      this.logger.warn('Rejected admin login attempt.');
      throw this.invalidCredentialsError();
    }

    const authContext = this.buildAdminAuthContext(normalizedEmail);
    const profile = await this.usersService.syncProfile(authContext);
    const accessToken = await this.mintAccessToken(authContext);

    return {
      accessToken,
      expiresIn: env.authAccessTokenTtlSeconds,
      user: {
        userId: authContext.sub,
        email: normalizedEmail,
        role: profile.role,
        status: profile.status,
      },
    };
  }

  async createAdminUser(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<AdminUserResponseDto> {
    const normalizedEmail = input.email.trim().toLowerCase();
    this.assertAllowedAdminEmail(normalizedEmail);

    const existingAccount = await this.findCredentialAccount(normalizedEmail);
    if (existingAccount) {
      throw new ConflictException({
        code: 'ADMIN_CREDENTIAL_EXISTS',
        message: 'Admin credential already exists',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, ADMIN_PASSWORD_HASH_ROUNDS);
    const { authContext, profile } = await this.upsertAdminCredential({
      email: normalizedEmail,
      passwordHash,
      name: input.name,
    });

    return {
      user: {
        userId: authContext.sub,
        email: normalizedEmail,
        role: profile.role,
        status: profile.status,
      },
    };
  }

  async changeAdminPassword(input: {
    email: string;
    newPassword: string;
  }): Promise<AdminUserResponseDto> {
    const normalizedEmail = input.email.trim().toLowerCase();
    this.assertAllowedAdminEmail(normalizedEmail);

    const account = await this.findCredentialAccount(normalizedEmail);
    if (!account) {
      throw new NotFoundException({
        code: 'ADMIN_CREDENTIAL_NOT_FOUND',
        message: 'Admin credential not found',
      });
    }

    account.passwordHash = await bcrypt.hash(input.newPassword, ADMIN_PASSWORD_HASH_ROUNDS);
    await this.authAccountsRepository.save(account);

    const authContext = this.buildAdminAuthContext(normalizedEmail);
    const profile = await this.usersService.syncProfile(authContext);

    return {
      user: {
        userId: authContext.sub,
        email: normalizedEmail,
        role: profile.role,
        status: profile.status,
      },
    };
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.warn(
        `Password verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }.`,
      );
      return false;
    }
  }

  private deriveAdminUserId(normalizedEmail: string): string {
    const digest = createHash('sha256').update(`admin:${normalizedEmail}`).digest('hex');
    return `admin_${digest.slice(0, 32)}`;
  }

  private buildAdminAuthContext(normalizedEmail: string): AuthContext {
    return {
      sub: this.deriveAdminUserId(normalizedEmail),
      authType: 'admin',
      email: normalizedEmail,
      role: UserRole.ADMIN,
      sessionId: randomUUID(),
    };
  }

  private getAllowedAdminEmails(): Set<string> {
    const emails = new Set(env.adminEmails);
    const legacyAdminEmail = env.adminEmail.trim().toLowerCase();
    if (legacyAdminEmail) {
      emails.add(legacyAdminEmail);
    }
    return emails;
  }

  private isAllowedAdminEmail(normalizedEmail: string): boolean {
    return this.getAllowedAdminEmails().has(normalizedEmail);
  }

  private assertAllowedAdminEmail(normalizedEmail: string): void {
    if (!this.isAllowedAdminEmail(normalizedEmail)) {
      throw new ForbiddenException({
        code: 'ADMIN_EMAIL_NOT_ALLOWED',
        message: 'Admin email is not allowlisted',
      });
    }
  }

  private canUseLegacyPasswordFallback(normalizedEmail: string): boolean {
    const legacyAdminEmail = env.adminEmail.trim().toLowerCase();
    return Boolean(
      legacyAdminEmail
      && env.adminPasswordHash
      && normalizedEmail === legacyAdminEmail,
    );
  }

  private findCredentialAccount(normalizedEmail: string): Promise<AuthAccountEntity | null> {
    return this.authAccountsRepository.findOne({
      where: {
        provider: ADMIN_CREDENTIAL_PROVIDER,
        providerAccountId: normalizedEmail,
      },
    });
  }

  private async upsertAdminCredential(input: {
    email: string;
    passwordHash: string;
    name?: string;
  }) {
    const authContext = this.buildAdminAuthContext(input.email);
    let authUser = await this.authUsersRepository.findOne({
      where: { id: authContext.sub },
    });

    if (!authUser) {
      authUser = this.authUsersRepository.create({
        id: authContext.sub,
        email: input.email,
        emailVerified: true,
        name: input.name?.trim() || null,
        image: null,
      });
    } else {
      authUser.email = input.email;
      authUser.emailVerified = true;
      if (input.name !== undefined) {
        authUser.name = input.name.trim() || null;
      }
    }

    await this.authUsersRepository.save(authUser);

    let account = await this.findCredentialAccount(input.email);
    if (!account) {
      account = this.authAccountsRepository.create({
        userId: authContext.sub,
        provider: ADMIN_CREDENTIAL_PROVIDER,
        providerAccountId: input.email,
        passwordHash: input.passwordHash,
      });
    } else {
      account.userId = authContext.sub;
      account.passwordHash = input.passwordHash;
    }

    await this.authAccountsRepository.save(account);
    const profile = await this.usersService.syncProfile(authContext);

    return { authContext, profile };
  }

  private invalidCredentialsError() {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  }

  private async mintAccessToken(authContext: AuthContext): Promise<string> {
    return this.jwtService.signAsync(
      {
        authType: authContext.authType,
        email: authContext.email,
        role: authContext.role,
        sessionId: authContext.sessionId,
      },
      {
        secret: env.internalAuthJwtSecret,
        issuer: env.internalAuthIssuer,
        audience: env.internalAuthAudience,
        subject: authContext.sub,
        expiresIn: env.authAccessTokenTtlSeconds,
      },
    );
  }
}
