import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { UserRole, UserStatus } from '../../common/enums/domain.enums';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

const adminUser = {
  userId: 'admin_test',
  email: 'admin@flowdex.app',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
};

describe('AdminAuthController', () => {
  let app: INestApplication;
  const adminAuthService = {
    login: jest.fn(),
    createAdminUser: jest.fn(),
    changeAdminPassword: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AdminAuthService,
          useValue: adminAuthService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an admin user through POST /api/auth/admin-users', async () => {
    adminAuthService.createAdminUser.mockResolvedValue({ user: adminUser });

    const response = await request(app.getHttpServer())
      .post('/api/auth/admin-users')
      .send({
        email: 'admin@flowdex.app',
        password: 'super-secret-password',
        name: 'FlowDex Admin',
      })
      .expect(201);

    expect(response.body).toEqual({ user: adminUser });
    expect(adminAuthService.createAdminUser).toHaveBeenCalledWith({
      email: 'admin@flowdex.app',
      password: 'super-secret-password',
      name: 'FlowDex Admin',
    });
  });

  it('changes an admin password through PATCH /api/auth/admin-users/password', async () => {
    adminAuthService.changeAdminPassword.mockResolvedValue({ user: adminUser });

    const response = await request(app.getHttpServer())
      .patch('/api/auth/admin-users/password')
      .send({
        email: 'admin@flowdex.app',
        newPassword: 'new-super-secret-password',
      })
      .expect(200);

    expect(response.body).toEqual({ user: adminUser });
    expect(adminAuthService.changeAdminPassword).toHaveBeenCalledWith({
      email: 'admin@flowdex.app',
      newPassword: 'new-super-secret-password',
    });
  });

  it('rejects invalid admin create payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/admin-users')
      .send({
        email: 'not-an-email',
        password: 'short',
      })
      .expect(400);

    expect(adminAuthService.createAdminUser).not.toHaveBeenCalled();
  });
});
