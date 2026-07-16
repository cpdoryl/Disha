import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

describe('RBAC Integration Tests', () => {
  let app: INestApplication;
  let tokens: { [key: string]: string } = {};

  beforeAll(async () => {
    app = await setupTestApp();

    // Login as each role and get tokens
    for (const [key, user] of Object.entries(TEST_USERS)) {
      const response = await request(app.getHttpServer())
        .post('/api/v2/auth/login')
        .send({
          email: user.email,
          password: user.password,
        });

      tokens[key] = response.body.accessToken;
    }
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('SchoolController RBAC', () => {
    describe('POST /api/v2/schools (ryl_admin only)', () => {
      it('should allow ryl_admin to create school', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/schools')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`)
          .send({
            name: 'Test School',
            district_id: 'dist-1',
            organization_id: 'org-1',
          });

        expect([201, 400, 409]).toContain(response.status); // Created, bad request, or conflict
      });

      it('should deny school_admin from creating school', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/schools')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`)
          .send({
            name: 'Test School 2',
            district_id: 'dist-1',
            organization_id: 'org-1',
          });

        expect(response.status).toBe(403); // Forbidden
      });

      it('should deny teacher from creating school', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/schools')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            name: 'Test School 3',
            district_id: 'dist-1',
            organization_id: 'org-1',
          });

        expect(response.status).toBe(403); // Forbidden
      });
    });

    describe('GET /api/v2/schools/:id (ryl_admin, school_admin, teacher)', () => {
      it('should allow ryl_admin to view school', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should allow school_admin to view school', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should allow teacher to view school', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1')
          .set('Authorization', `Bearer ${tokens.teacher}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should require authentication', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1');

        expect(response.status).toBe(401); // Unauthorized
      });
    });

    describe('PATCH /api/v2/schools/:id/deactivate (ryl_admin only)', () => {
      it('should allow ryl_admin to deactivate school', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v2/schools/school-1/deactivate')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should deny school_admin from deactivating school', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v2/schools/school-1/deactivate')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`);

        expect(response.status).toBe(403); // Forbidden
      });
    });
  });

  describe('StudentController RBAC', () => {
    describe('POST /api/v2/students (ryl_admin, school_admin)', () => {
      it('should allow ryl_admin to create student', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/students')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`)
          .send({
            name: 'Test Student',
            school_id: 'school-1',
            grade: '5',
          });

        expect([201, 400]).toContain(response.status);
      });

      it('should allow school_admin to create student', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/students')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`)
          .send({
            name: 'Test Student 2',
            school_id: 'school-1',
            grade: '6',
          });

        expect([201, 400]).toContain(response.status);
      });

      it('should deny teacher from creating student', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/students')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            name: 'Test Student 3',
            school_id: 'school-1',
            grade: '7',
          });

        expect(response.status).toBe(403); // Forbidden
      });
    });

    describe('GET /api/v2/students/:id (all authenticated users)', () => {
      it('should allow ryl_admin to view student', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/students/student-1')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should allow school_admin to view student', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/students/student-1')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should allow teacher to view student', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/students/student-1')
          .set('Authorization', `Bearer ${tokens.teacher}`);

        expect([200, 400, 404]).toContain(response.status);
      });
    });

    describe('POST /api/v2/students/:id/attendance (ryl_admin, school_admin, teacher)', () => {
      it('should allow teacher to record attendance', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/students/student-1/attendance')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            date: new Date().toISOString(),
            present: true,
          });

        expect([201, 400, 404]).toContain(response.status);
      });

      it('should deny unauthorized access', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/students/student-1/attendance')
          .send({
            date: new Date().toISOString(),
            present: true,
          });

        expect(response.status).toBe(401); // Unauthorized
      });
    });
  });

  describe('AssessmentController RBAC', () => {
    describe('POST /api/v2/assessments/create (ryl_admin, school_admin)', () => {
      it('should allow ryl_admin to create assessment', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/assessments/create')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`)
          .send({
            school_id: 'school-1',
            name: 'Test Assessment',
            challenges: [],
          });

        expect([201, 400]).toContain(response.status);
      });

      it('should allow school_admin to create assessment', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/assessments/create')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`)
          .send({
            school_id: 'school-1',
            name: 'Test Assessment 2',
            challenges: [],
          });

        expect([201, 400]).toContain(response.status);
      });

      it('should deny teacher from creating assessment', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/assessments/create')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            school_id: 'school-1',
            name: 'Test Assessment 3',
            challenges: [],
          });

        expect(response.status).toBe(403); // Forbidden
      });
    });

    describe('POST /api/v2/assessments/:assessmentId/submit (public)', () => {
      it('should allow submission without authentication', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/assessments/assessment-1/submit')
          .send({
            assessmentId: 'assessment-1',
            respondentId: 'respondent-1',
            respondentType: 'student',
            responses: [],
          });

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should also allow submission with authentication', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/assessments/assessment-1/submit')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            assessmentId: 'assessment-1',
            respondentId: 'respondent-2',
            respondentType: 'student',
            responses: [],
          });

        expect([200, 400, 404]).toContain(response.status);
      });
    });

    describe('PATCH /api/v2/assessments/:id/status (ryl_admin, school_admin)', () => {
      it('should allow ryl_admin to update status', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v2/assessments/assessment-1/status')
          .set('Authorization', `Bearer ${tokens.rylAdmin}`)
          .send({ status: 'active' });

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should deny teacher from updating status', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v2/assessments/assessment-1/status')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({ status: 'active' });

        expect(response.status).toBe(403); // Forbidden
      });
    });
  });

  describe('DataController RBAC', () => {
    describe('All Data endpoints require (ryl_admin, school_admin, teacher)', () => {
      it('should allow teacher to access operational data', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/data/operational/school/school-1')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .query({
            startDate: '2026-01-01',
            endDate: '2026-07-14',
          });

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should deny unauthorized access to operational data', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/data/operational/school/school-1');

        expect(response.status).toBe(401); // Unauthorized
      });
    });
  });

  describe('AuditController RBAC', () => {
    describe('All Audit endpoints require (ryl_admin, school_admin)', () => {
      it('should allow school_admin to access audit logs', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/audit/logs/school/school-1')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`)
          .query({
            startDate: '2026-01-01',
            endDate: '2026-07-14',
          });

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should deny teacher from accessing audit logs', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/audit/logs/school/school-1')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .query({
            startDate: '2026-01-01',
            endDate: '2026-07-14',
          });

        expect(response.status).toBe(403); // Forbidden
      });
    });
  });

  describe('NotificationController RBAC', () => {
    describe('All Notification endpoints require (ryl_admin, school_admin, teacher)', () => {
      it('should allow teacher to send notification', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/notifications/send')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            recipientId: 'user-1',
            message: 'Test notification',
            type: 'alert',
          });

        expect([202, 400]).toContain(response.status);
      });

      it('should deny unauthorized user from sending notification', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/notifications/send')
          .send({
            recipientId: 'user-1',
            message: 'Test notification',
            type: 'alert',
          });

        expect(response.status).toBe(401); // Unauthorized
      });
    });
  });

  describe('ReportingController RBAC', () => {
    describe('GET /api/v2/reports/student/:studentId/progress (includes parent access)', () => {
      it('should allow teacher to view student progress', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/reports/student/student-1/progress')
          .set('Authorization', `Bearer ${tokens.teacher}`);

        expect([200, 400, 404]).toContain(response.status);
      });

      it('should deny unauthorized access to student progress', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/reports/student/student-1/progress');

        expect(response.status).toBe(401); // Unauthorized
      });
    });

    describe('POST /api/v2/reports/export (ryl_admin, school_admin only)', () => {
      it('should allow school_admin to export report', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/reports/export')
          .set('Authorization', `Bearer ${tokens.schoolAdmin}`)
          .send({
            reportType: 'assessment',
            data: [],
          });

        expect([200, 400]).toContain(response.status);
      });

      it('should deny teacher from exporting report', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/reports/export')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            reportType: 'assessment',
            data: [],
          });

        expect(response.status).toBe(403); // Forbidden
      });
    });
  });

  describe('WellbeingController RBAC', () => {
    describe('All Wellbeing endpoints require (ryl_admin, school_admin, teacher)', () => {
      it('should allow teacher to record bullying incident', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/wellbeing/bullying-incident')
          .set('Authorization', `Bearer ${tokens.teacher}`)
          .send({
            studentId: 'student-1',
            description: 'Test incident',
            date: new Date().toISOString(),
          });

        expect([201, 400]).toContain(response.status);
      });

      it('should deny unauthorized user from recording incident', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v2/wellbeing/bullying-incident')
          .send({
            studentId: 'student-1',
            description: 'Test incident',
            date: new Date().toISOString(),
          });

        expect(response.status).toBe(401); // Unauthorized
      });
    });
  });

  describe('ChallengeController (public access)', () => {
    describe('GET /challenges (no auth required)', () => {
      it('should allow public access to challenges list', async () => {
        const response = await request(app.getHttpServer())
          .get('/challenges');

        expect([200, 400]).toContain(response.status);
      });
    });

    describe('GET /challenges/:id (no auth required)', () => {
      it('should allow public access to specific challenge', async () => {
        const response = await request(app.getHttpServer())
          .get('/challenges/challenge-1');

        expect([200, 400, 404]).toContain(response.status);
      });
    });
  });

  describe('Authentication (Integration)', () => {
    describe('Token validation across different endpoints', () => {
      it('should deny access with missing Authorization header', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1');

        expect(response.status).toBe(401);
      });

      it('should deny access with invalid token format', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1')
          .set('Authorization', 'InvalidFormat token');

        expect(response.status).toBe(401);
      });

      it('should deny access with malformed JWT', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v2/schools/school-1')
          .set('Authorization', 'Bearer malformed.jwt.token');

        expect(response.status).toBe(401);
      });
    });
  });
});
