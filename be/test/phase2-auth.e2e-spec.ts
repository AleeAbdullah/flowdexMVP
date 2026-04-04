import * as request from 'supertest';

import { UserRole } from '../src/common/enums/domain.enums';
import {
  authHeader,
  bootstrapPhase2App,
  createInternalAuthToken,
  resetPhase2TestDatabase,
  seedPhase2Base,
  shutdownPhase2App,
  truncatePhase2Tables,
  type TestContext,
} from './helpers/phase2-harness';

describe('Phase 2 Auth and Guarded Access (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    await resetPhase2TestDatabase();
    context = await bootstrapPhase2App();
  });

  afterAll(async () => {
    await shutdownPhase2App(context);
  });

  beforeEach(async () => {
    await truncatePhase2Tables(context.dataSource);
    await seedPhase2Base(context.dataSource);
  });

  it('GET /api/auth/me succeeds with a valid internal JWT', async () => {
    const token = createInternalAuthToken({
      sub: 'phase2-user',
      email: 'user@flowdex.test',
      role: UserRole.USER,
    });

    const response = await request(context.app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(200);

    expect(response.body).toMatchObject({
      userId: 'phase2-user',
      email: 'user@flowdex.test',
      role: 'USER',
      status: 'ACTIVE',
      wallets: [],
    });
  });

  it('rejects missing bearer tokens', async () => {
    await request(context.app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rejects invalid internal JWTs', async () => {
    await request(context.app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader('not-a-valid-token'))
      .expect(401);
  });

  it('blocks suspended users from protected APIs', async () => {
    const token = createInternalAuthToken({
      sub: 'phase2-suspended',
      email: 'suspended@flowdex.test',
      role: UserRole.USER,
    });

    const response = await request(context.app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(403);

    expect(response.body.message).toContain('User account is not active');
  });

  it('enforces admin-only routes', async () => {
    const userToken = createInternalAuthToken({
      sub: 'phase2-user',
      email: 'user@flowdex.test',
      role: UserRole.USER,
    });
    const adminToken = createInternalAuthToken({
      sub: 'phase2-admin',
      email: 'admin@flowdex.test',
      role: UserRole.ADMIN,
    });

    await request(context.app.getHttpServer())
      .get('/api/admin/stats')
      .set(authHeader(userToken))
      .expect(403);

    const adminResponse = await request(context.app.getHttpServer())
      .get('/api/admin/stats')
      .set(authHeader(adminToken))
      .expect(200);

    expect(adminResponse.body).toEqual(
      expect.objectContaining({
        totalConfirmedVolumeReal: expect.any(String),
        totalConfirmedVolumeDisplay: expect.any(String),
        transactionCountsByStatus: expect.any(Object),
      }),
    );
  });
});
