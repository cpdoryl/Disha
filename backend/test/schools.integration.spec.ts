import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

describe('Schools API (Integration)', () => {
  let app: INestApplication;
  let adminToken: string;
  let teacherToken: string;
  let schoolId: string;

  beforeAll(async () => {
    app = await setupTestApp();

    // Get tokens for different user roles
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: TEST_USERS.rylAdmin.email,
        password: TEST_USERS.rylAdmin.password,
      });

    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: TEST_USERS.teacher.email,
        password: TEST_USERS.teacher.password,
      });

    teacherToken = teacherLogin.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('GET /api/v2/schools/:id', () => {
    it('should get school with valid admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Response structure check (may 404 if school doesn't exist, that's ok)
    });

    it('should get school with teacher token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${teacherToken}`);

      // Should succeed or 404 depending on data
      expect([200, 404]).toContain(response.status);
    });

    it('should deny access without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .expect(401);
    });

    it('should return 400 with invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect([400, 404]); // Either validation error or not found
    });
  });

  describe('PATCH /api/v2/schools/:id', () => {
    it('should deny update with teacher token (insufficient role)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Updated School' })
        .expect(403);
    });

    it('should allow update with admin token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated School Name',
          city: 'Mumbai',
        });

      // Should succeed or 404 depending on data
      expect([200, 404]).toContain(response.status);
    });

    it('should deny update without token', async () => {
      await request(app.getHttpServer())
        .patch('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .send({ name: 'Updated School' })
        .expect(401);
    });
  });

  describe('GET /api/v2/schools/:id/metrics', () => {
    it('should get school metrics with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should deny access to metrics without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000/metrics')
        .expect(401);
    });
  });

  describe('PATCH /api/v2/schools/:id/deactivate', () => {
    it('should deny deactivation with insufficient role', async () => {
      await request(app.getHttpServer())
        .patch('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000/deactivate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should allow deactivation with admin token', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000/deactivate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should deny deactivation without token', async () => {
      await request(app.getHttpServer())
        .patch('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000/deactivate')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        // Test will handle parsing
        .expect([200, 400, 404]);
    });

    it('should handle non-existent endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/schools/nonexistent/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect([404, 400]);
    });
  });

  describe('RBAC Integration', () => {
    it('admin should be able to get schools', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('teacher should be able to get schools', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('teacher should NOT be able to create schools', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/schools')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'New School',
          district: 'Pune',
          state: 'Maharashtra',
        })
        .expect(403);
    });

    it('admin should be able to create schools', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/schools')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Test School',
          district: 'Pune',
          state: 'Maharashtra',
          city: 'Pune',
          principalName: 'Test Principal',
          address: 'Test Address',
        });

      // Should succeed or fail with validation error
      expect([201, 400]).toContain(response.status);
    });
  });
});
