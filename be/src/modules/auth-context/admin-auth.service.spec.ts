import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UserRole, UserStatus } from '../../common/enums/domain.enums';
import { env } from '../../infrastructure/config/env';
import { AuthAccountEntity, AuthUserEntity } from '../../infrastructure/database/entities/auth.entities';
import { AdminAuthService } from './admin-auth.service';

const TEST_SECRET = 'test-internal-auth-secret-value';
const TEST_EMAIL = 'admin@flowdex.app';
const SECOND_EMAIL = 'ops@flowdex.app';
const TEST_PASSWORD = 'super-secret-password';
const NEXT_PASSWORD = 'new-super-secret-password';

type RepoState = {
  users: Map<string, AuthUserEntity>;
  accounts: Map<string, AuthAccountEntity>;
};

function accountKey(provider: string, providerAccountId: string) {
  return `${provider}:${providerAccountId}`;
}

function buildService() {
  const jwtService = new JwtService({});
  const state: RepoState = {
    users: new Map(),
    accounts: new Map(),
  };
  const usersService = {
    syncProfile: jest.fn(async auth => ({
      userId: auth.sub,
      role: auth.role ?? UserRole.USER,
      status: UserStatus.ACTIVE,
    })),
  };
  const authUsersRepository = {
    findOne: jest.fn(async (input: { where: { id: string } }) =>
      state.users.get(input.where.id) ?? null),
    create: jest.fn((input: Partial<AuthUserEntity>) => input as AuthUserEntity),
    save: jest.fn(async (user: AuthUserEntity) => {
      state.users.set(user.id, user);
      return user;
    }),
  };
  const authAccountsRepository = {
    findOne: jest.fn(async (input: { where: { provider: string; providerAccountId: string } }) =>
      state.accounts.get(accountKey(input.where.provider, input.where.providerAccountId)) ?? null),
    create: jest.fn((input: Partial<AuthAccountEntity>) => input as AuthAccountEntity),
    save: jest.fn(async (account: AuthAccountEntity) => {
      state.accounts.set(accountKey(account.provider, account.providerAccountId), account);
      return account;
    }),
  };

  const service = new AdminAuthService(
    jwtService,
    usersService as never,
    authUsersRepository as never,
    authAccountsRepository as never,
  );

  return {
    service,
    jwtService,
    usersService,
    authUsersRepository,
    authAccountsRepository,
    state,
  };
}

describe('AdminAuthService', () => {
  let originalEmails: string[];
  let originalEmail: string;
  let originalHash: string;
  let originalSecret: string;

  beforeEach(() => {
    originalEmails = env.adminEmails;
    originalEmail = env.adminEmail;
    originalHash = env.adminPasswordHash;
    originalSecret = env.internalAuthJwtSecret;

    env.adminEmails = [TEST_EMAIL, SECOND_EMAIL];
    env.adminEmail = '';
    env.adminPasswordHash = '';
    env.internalAuthJwtSecret = TEST_SECRET;
  });

  afterEach(() => {
    env.adminEmails = originalEmails;
    env.adminEmail = originalEmail;
    env.adminPasswordHash = originalHash;
    env.internalAuthJwtSecret = originalSecret;
  });

  it('creates an allowlisted admin credential', async () => {
    const { service, state, usersService } = buildService();

    const result = await service.createAdminUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'FlowDex Admin',
    });

    expect(result.user.email).toBe(TEST_EMAIL);
    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(usersService.syncProfile).toHaveBeenCalledTimes(1);
    expect(state.users.size).toBe(1);
    expect(state.accounts.get(accountKey('credential', TEST_EMAIL))?.passwordHash).toEqual(expect.any(String));
  });

  it('rejects admin creation for non-allowlisted emails', async () => {
    const { service } = buildService();

    await expect(service.createAdminUser({
      email: 'someone-else@flowdex.app',
      password: TEST_PASSWORD,
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate admin credential creation', async () => {
    const { service } = buildService();

    await service.createAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD });

    await expect(service.createAdminUser({
      email: TEST_EMAIL,
      password: NEXT_PASSWORD,
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('mints an admin access token for valid DB credentials', async () => {
    const { service, jwtService, usersService } = buildService();
    await service.createAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const result = await service.login(TEST_EMAIL, TEST_PASSWORD);

    expect(usersService.syncProfile).toHaveBeenCalledTimes(2);
    expect(result.user.email).toBe(TEST_EMAIL);
    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(result.expiresIn).toBe(env.authAccessTokenTtlSeconds);

    const decoded = await jwtService.verifyAsync(result.accessToken, {
      secret: TEST_SECRET,
      issuer: env.internalAuthIssuer,
      audience: env.internalAuthAudience,
    });

    expect(decoded.authType).toBe('admin');
    expect(decoded.role).toBe(UserRole.ADMIN);
    expect(decoded.email).toBe(TEST_EMAIL);
    expect(decoded.sub).toEqual(expect.stringContaining('admin_'));
    expect(decoded.sessionId).toEqual(expect.any(String));
  });

  it('normalizes email casing and whitespace on login', async () => {
    const { service } = buildService();
    await service.createAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const result = await service.login(`  ${TEST_EMAIL.toUpperCase()}  `, TEST_PASSWORD);

    expect(result.user.email).toBe(TEST_EMAIL);
  });

  it('rejects an unknown email on login', async () => {
    const { service, usersService } = buildService();

    await expect(service.login('someone-else@flowdex.app', TEST_PASSWORD)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.syncProfile).not.toHaveBeenCalled();
  });

  it('rejects an invalid DB password', async () => {
    const { service } = buildService();
    await service.createAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD });

    await expect(service.login(TEST_EMAIL, 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('changes the password for an existing admin credential', async () => {
    const { service } = buildService();
    await service.createAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const result = await service.changeAdminPassword({
      email: TEST_EMAIL,
      newPassword: NEXT_PASSWORD,
    });

    expect(result.user.email).toBe(TEST_EMAIL);
    await expect(service.login(TEST_EMAIL, TEST_PASSWORD)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.login(TEST_EMAIL, NEXT_PASSWORD)).resolves.toMatchObject({
      user: { email: TEST_EMAIL, role: UserRole.ADMIN },
    });
  });

  it('returns not found when changing a missing admin credential', async () => {
    const { service } = buildService();

    await expect(service.changeAdminPassword({
      email: TEST_EMAIL,
      newPassword: NEXT_PASSWORD,
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('logs in with the legacy env hash and persists it when no DB credential exists', async () => {
    const legacyHash = await bcrypt.hash(TEST_PASSWORD, 10);
    env.adminEmails = [];
    env.adminEmail = TEST_EMAIL;
    env.adminPasswordHash = legacyHash;

    const { service, state } = buildService();

    await expect(service.login(TEST_EMAIL, TEST_PASSWORD)).resolves.toMatchObject({
      user: { email: TEST_EMAIL, role: UserRole.ADMIN },
    });

    const account = state.accounts.get(accountKey('credential', TEST_EMAIL));
    expect(account?.passwordHash).toBe(legacyHash);
  });
});
