import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

function decodeSchoolId(token: string): string {
  const payload = token.split('.')[1];
  const json = Buffer.from(payload, 'base64').toString('utf8');
  return JSON.parse(json).schoolId;
}

describe('New Modules (Integration)', () => {
  let app: INestApplication;
  let rylAdminToken: string;
  let schoolAdminToken: string;
  let teacherToken: string;
  let schoolId: string;
  let studentId: string;

  beforeAll(async () => {
    app = await setupTestApp();

    const rylAdminLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.rylAdmin.email, password: TEST_USERS.rylAdmin.password });
    rylAdminToken = rylAdminLogin.body.accessToken;

    const schoolAdminLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.schoolAdmin.email, password: TEST_USERS.schoolAdmin.password });
    schoolAdminToken = schoolAdminLogin.body.accessToken;
    schoolId = decodeSchoolId(schoolAdminToken);

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: TEST_USERS.teacher.email, password: TEST_USERS.teacher.password });
    teacherToken = teacherLogin.body.accessToken;

    const studentsResponse = await request(app.getHttpServer())
      .get(`/api/v2/students/school/${schoolId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    studentId = studentsResponse.body[0]?.id;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('Staff', () => {
    let staffId: string;

    it('allows school_admin to create a staff record', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/staff')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schoolId,
          employeeId: `EMP-${Date.now()}`,
          firstName: 'Test',
          lastName: 'Teacher',
          position: 'teacher',
          startDate: '2024-06-01',
        })
        .expect(201);

      staffId = response.body.id;
      expect(response.body.schoolId).toBe(schoolId);
    });

    it('denies teacher from creating a staff record', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          schoolId,
          employeeId: `EMP-${Date.now()}`,
          firstName: 'Denied',
          position: 'teacher',
          startDate: '2024-06-01',
        })
        .expect(403);
    });

    it('lists staff by school and reflects the retention summary', async () => {
      const listResponse = await request(app.getHttpServer())
        .get(`/api/v2/staff/school/${schoolId}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(listResponse.body.some((s: any) => s.id === staffId)).toBe(true);

      const retentionResponse = await request(app.getHttpServer())
        .get(`/api/v2/staff/school/${schoolId}/retention`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(retentionResponse.body.totalStaff).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Admissions', () => {
    it('allows school_admin to create an admission inquiry and see it in the funnel', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/admissions')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schoolId,
          studentName: 'Prospective Student',
          dateOfBirth: '2016-01-01',
          gradeApplied: 2,
          admissionDate: new Date().toISOString().slice(0, 10),
          sourceOfInquiry: 'walk_in',
        })
        .expect(201);

      const funnelResponse = await request(app.getHttpServer())
        .get(`/api/v2/admissions/school/${schoolId}/funnel`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(funnelResponse.body.inquiry).toBeGreaterThanOrEqual(1);
    });

    it('denies teacher from creating an admission inquiry', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/admissions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          schoolId,
          studentName: 'Denied Student',
          dateOfBirth: '2016-01-01',
          gradeApplied: 2,
          admissionDate: new Date().toISOString().slice(0, 10),
          sourceOfInquiry: 'walk_in',
        })
        .expect(403);
    });
  });

  describe('Communication', () => {
    it('lets a teacher log a communication and school_admin see the response metrics', async () => {
      const logResponse = await request(app.getHttpServer())
        .post('/api/v2/communication')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          schoolId,
          studentId,
          queryDate: new Date().toISOString(),
          queryChannel: 'whatsapp',
          queryTopic: 'Test query',
          queryDescription: 'Integration test query',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v2/communication/${logResponse.body.id}/respond`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ responseContent: 'Test response' })
        .expect(200);

      const metrics = await request(app.getHttpServer())
        .get(`/api/v2/communication/school/${schoolId}/metrics`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(metrics.body.totalQueries).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Compliance', () => {
    it('allows school_admin to log and resolve a complaint', async () => {
      const complaintResponse = await request(app.getHttpServer())
        .post('/api/v2/compliance/complaints')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schoolId,
          complaintDate: new Date().toISOString().slice(0, 10),
          category: 'academic',
          severity: 'low',
          complaintDescription: 'Integration test complaint',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v2/compliance/complaints/${complaintResponse.body.id}/resolve`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ resolutionMethod: 'Phone call' })
        .expect(200);
    });

    it('denies teacher from viewing data retention policies', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/compliance/data-retention-policies')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  describe('Fees', () => {
    it('allows school_admin to create a fee entry and record a payment', async () => {
      const feeResponse = await request(app.getHttpServer())
        .post('/api/v2/fees')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schoolId,
          studentId,
          academicYear: '2026-27',
          feeType: 'tuition',
          amount: 10000,
          dueDate: '2026-08-01',
        })
        .expect(201);

      const paymentResponse = await request(app.getHttpServer())
        .patch(`/api/v2/fees/${feeResponse.body.id}/payment`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({ paidAmount: 10000, paymentMethod: 'upi' })
        .expect(200);
      expect(paymentResponse.body.status).toBe('paid');

      const summary = await request(app.getHttpServer())
        .get(`/api/v2/fees/school/${schoolId}/summary`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(summary.body.totalCollected).toBeGreaterThanOrEqual(10000);
    });
  });

  describe('Infrastructure', () => {
    it('allows school_admin to record a status snapshot and fetch the latest one', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/infrastructure')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .send({
          schoolId,
          dataDate: new Date().toISOString().slice(0, 10),
          status: { classroomCount: 15, hasLibrary: true },
        })
        .expect(201);

      const latest = await request(app.getHttpServer())
        .get(`/api/v2/infrastructure/school/${schoolId}/latest`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(latest.body.dataValue.classroomCount).toBe(15);
    });

    it('denies teacher from recording a status snapshot', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/infrastructure')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ schoolId, dataDate: '2026-07-01', status: {} })
        .expect(403);
    });
  });

  describe('Gap Predictions', () => {
    it('allows school_admin to fetch (possibly empty) gap predictions for a school', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v2/gap-predictions/school/${schoolId}`)
        .query({ academicYear: '2026-27' })
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('denies teacher from fetching gap predictions', async () => {
      await request(app.getHttpServer())
        .get(`/api/v2/gap-predictions/school/${schoolId}`)
        .query({ academicYear: '2026-27' })
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  describe('Users', () => {
    it('allows ryl_admin to view the org-wide overview', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/users/stats/overview')
        .set('Authorization', `Bearer ${rylAdminToken}`)
        .expect(200);
      expect(response.body.totalSchools).toBeGreaterThanOrEqual(1);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('denies school_admin from viewing the org-wide overview', async () => {
      await request(app.getHttpServer())
        .get('/api/v2/users/stats/overview')
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(403);
    });

    it('allows school_admin to list users in their own school', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v2/users/school/${schoolId}`)
        .set('Authorization', `Bearer ${schoolAdminToken}`)
        .expect(200);
      expect(response.body.some((u: any) => u.email === TEST_USERS.schoolAdmin.email)).toBe(true);
    });
  });
});
