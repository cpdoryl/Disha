import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ReportingController } from './reporting.controller';
import { ReportingService, ReportType } from '../../services/reporting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  School,
  Assessment,
  AssessmentResponse,
  Student,
  StudentAcademicAssessment,
  StudentAttendance,
} from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('ReportingController (integration)', () => {
  let app: INestApplication;
  let assessmentRepo: MockRepo<Assessment>;
  let schoolRepo: MockRepo<School>;

  const schoolId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    assessmentRepo = createMockRepo<Assessment>();
    schoolRepo = createMockRepo<School>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [
        ReportingService,
        { provide: getRepositoryToken(School), useValue: schoolRepo },
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: createMockRepo<AssessmentResponse>() },
        { provide: getRepositoryToken(Student), useValue: createMockRepo<Student>() },
        {
          provide: getRepositoryToken(StudentAcademicAssessment),
          useValue: createMockRepo<StudentAcademicAssessment>(),
        },
        { provide: getRepositoryToken(StudentAttendance), useValue: createMockRepo<StudentAttendance>() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /reports/assessments/:assessmentId/summary', () => {
    it('returns 404 when the assessment does not exist', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get('/reports/assessments/missing-id/summary').expect(404);
    });
  });

  describe('GET /reports/schools/:schoolId/performance', () => {
    it('requires startDate and endDate', async () => {
      await request(app.getHttpServer()).get(`/reports/schools/${schoolId}/performance`).expect(400);
    });

    it('returns 404 when the school does not exist', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/reports/schools/${schoolId}/performance?startDate=2026-01-01&endDate=2026-01-31`)
        .expect(404);
    });
  });

  describe('POST /reports/export', () => {
    it('exports an array of records as CSV', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/export')
        .send({ reportType: ReportType.SCHOOL_PERFORMANCE, data: [{ name: 'Greenwood', students: 500 }] })
        .expect(201);

      expect(response.body.csv).toBe('name,students\nGreenwood,500');
    });
  });

  describe('POST /reports/schedule', () => {
    it('rejects a schedule with no recipients', async () => {
      await request(app.getHttpServer())
        .post('/reports/schedule')
        .send({ reportType: ReportType.SCHOOL_PERFORMANCE, schoolId, frequency: 'weekly', recipients: [] })
        .expect(400);
    });

    it('schedules a report with valid recipients', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports/schedule')
        .send({
          reportType: ReportType.SCHOOL_PERFORMANCE,
          schoolId,
          frequency: 'weekly',
          recipients: ['owner@example.com'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
