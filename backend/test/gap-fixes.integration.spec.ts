import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

describe('Dashboard Gap Fixes (Integration)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let parentToken: string;
  let schoolAdminToken: string;
  let teacherSchoolId: string;

  beforeAll(async () => {
    app = await setupTestApp();

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.teacher.email, password: TEST_USERS.teacher.password });
    teacherToken = teacherLogin.body.accessToken;
    teacherSchoolId = JSON.parse(
      Buffer.from(teacherToken.split('.')[1], 'base64').toString(),
    ).schoolId;

    const parentLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: 'parent1@disha.local', password: 'parent123' });
    parentToken = parentLogin.body.accessToken;

    const schoolAdminLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.schoolAdmin.email, password: TEST_USERS.schoolAdmin.password });
    schoolAdminToken = schoolAdminLogin.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('GET /api/v2/assessments/me/pending', () => {
    it("returns the logged-in teacher's pending assessments for their own school", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/assessments/me/pending')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      for (const assessment of response.body) {
        expect(assessment.schoolId).toBe(teacherSchoolId);
        expect(assessment.status).toBe('active');
      }
    });

    it('denies a parent from calling the teacher-only pending assessments endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/assessments/me/pending')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v2/students/school/:schoolId/attendance/today', () => {
    it("returns today's attendance summary for a teacher's school", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v2/students/school/${teacherSchoolId}/attendance/today`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalActiveStudents');
      expect(response.body).toHaveProperty('presentCount');
      expect(response.body).toHaveProperty('absentCount');
      expect(response.body).toHaveProperty('unmarkedCount');
    });

    it('denies a parent from calling the attendance-today endpoint', async () => {
      await request(app.getHttpServer())
        .get(`/api/v2/students/school/${teacherSchoolId}/attendance/today`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v2/notifications/me', () => {
    it("returns the logged-in parent's own notifications", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/notifications/me')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('lets the teacher read their own (empty) notifications too', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/notifications/me')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PATCH /api/v2/notifications/:id/read', () => {
    it('marks the logged-in parent own notification as read', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v2/notifications/me')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      const notificationId = list.body[0].id;

      const updated = await request(app.getHttpServer())
        .patch(`/api/v2/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(updated.body.isRead).toBe(true);
    });
  });

  describe('GET /api/v2/communication/me', () => {
    it("returns the logged-in parent's own communications", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/communication/me')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('denies a school_admin from calling the parent-only communications endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/communication/me')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(403);
    });
  });
});
