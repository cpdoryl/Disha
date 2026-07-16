import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

describe('Authentication (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('POST /api/v2/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
          password: TEST_USERS.rylAdmin.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('tokenType');
      expect(response.body.tokenType).toBe('Bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(TEST_USERS.rylAdmin.email);
      expect(response.body.user.role).toBe(TEST_USERS.rylAdmin.role);
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should fail with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
        })
        .expect(400);
    });
  });

  describe('POST /api/v2/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
          password: TEST_USERS.rylAdmin.password,
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(refreshToken);
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);
    });

    it('should fail with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v2/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
          password: TEST_USERS.rylAdmin.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should fail to logout with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should fail to logout without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/auth/logout')
        .expect(401);
    });
  });

  describe('JWT Token Validation', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
          password: TEST_USERS.rylAdmin.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should allow access to protected endpoint with valid token', async () => {
      // Assuming GET /api/v2/schools requires auth
      const response = await request(app.getHttpServer())
        .get('/api/v2/schools')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should not return 401
      expect(response.status).not.toBe(401);
    });

    it('should deny access to protected endpoint without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools')
        .expect(401);
    });

    it('should deny access with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools')
        .set('Authorization', 'Bearer malformed.token')
        .expect(401);
    });

    it('should deny access with expired token', async () => {
      // This test would need a way to generate an expired token
      // For now, we can skip this or implement separately
    });
  });

  describe('Different User Roles', () => {
    it('should login as teacher with correct role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.teacher.email,
          password: TEST_USERS.teacher.password,
        })
        .expect(200);

      expect(response.body.user.role).toBe('teacher');
    });

    it('should return different tokens for different users', async () => {
      const adminLogin = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.rylAdmin.email,
          password: TEST_USERS.rylAdmin.password,
        });

      const teacherLogin = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: TEST_USERS.teacher.email,
          password: TEST_USERS.teacher.password,
        });

      expect(adminLogin.body.accessToken).not.toBe(teacherLogin.body.accessToken);
    });
  });
});
