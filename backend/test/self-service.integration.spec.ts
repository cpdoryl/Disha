import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

describe('Student/Parent Self-Service (Integration)', () => {
  let app: INestApplication;
  let schoolAdminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let parentToken: string;

  beforeAll(async () => {
    app = await setupTestApp();

    const schoolAdminLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.schoolAdmin.email, password: TEST_USERS.schoolAdmin.password });
    schoolAdminToken = schoolAdminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.teacher.email, password: TEST_USERS.teacher.password });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: 'student1@disha.local', password: 'student123' });
    studentToken = studentLogin.body.accessToken;

    const parentLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: 'parent1@disha.local', password: 'parent123' });
    parentToken = parentLogin.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('GET /api/v2/students/me', () => {
    it('returns the student record linked to the logged-in student user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/students/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toBeTruthy();
      expect(response.body.userId).toBeTruthy();
    });

    it('denies a teacher from calling the student self-service endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/students/me')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v2/students/me/attendance/report and me/academic-performance', () => {
    it("returns the logged-in student's own attendance report", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/students/me/attendance/report')
        .query({ startDate: '2020-01-01', endDate: '2030-01-01' })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('attendancePercentage');
    });

    it("returns the logged-in student's own academic performance", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/students/me/academic-performance')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('denies a parent from calling the student-only self-service endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/students/me/attendance/report')
        .query({ startDate: '2020-01-01', endDate: '2030-01-01' })
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v2/students/me/children', () => {
    it("returns the parent's linked children", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/students/me/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('denies a student from calling the parent self-service endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/students/me/children')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Admin-side linking', () => {
    let newStudentId: string;

    beforeAll(async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v2/students')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schoolId: JSON.parse(Buffer.from(schoolAdminToken.split('.')[1], 'base64').toString()).schoolId,
          enrollmentNumber: `LINK-TEST-${Date.now()}`,
          firstName: 'Link',
          lastName: 'Test',
          dateOfBirth: '2015-01-01',
          enrollmentDate: '2024-06-01',
        });
      newStudentId = created.body.id;
    });

    it('lets school_admin link a parent to a student, and rejects a duplicate link', async () => {
      const link = await request(app.getHttpServer())
        .post(`/api/v2/students/${newStudentId}/parents`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ relationship: 'father', parentUserId: JSON.parse(Buffer.from(parentToken.split('.')[1], 'base64').toString()).sub })
        .expect(201);
      expect(link.body.studentId).toBe(newStudentId);

      await request(app.getHttpServer())
        .post(`/api/v2/students/${newStudentId}/parents`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ relationship: 'father', parentUserId: JSON.parse(Buffer.from(parentToken.split('.')[1], 'base64').toString()).sub })
        .expect(409);
    });

    it('denies a teacher from linking a parent to a student', async () => {
      await request(app.getHttpServer())
        .post(`/api/v2/students/${newStudentId}/parents`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ parentUserId: 'irrelevant' })
        .expect(403);
    });
  });
});
