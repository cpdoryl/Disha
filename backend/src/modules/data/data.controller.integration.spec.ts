import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataController } from './data.controller';
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  OperationalData,
  MonitoringScorecard,
  ScorecardMetric,
  AssessmentResponse,
  StudentAttendance,
  StudentAcademicAssessment,
  Student,
  Staff,
  DataType,
} from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('DataController (integration)', () => {
  let app: INestApplication;
  let operationalRepo: MockRepo<OperationalData>;
  let scorecardRepo: MockRepo<MonitoringScorecard>;

  const schoolId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    operationalRepo = createMockRepo<OperationalData>();
    scorecardRepo = createMockRepo<MonitoringScorecard>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DataController],
      providers: [
        DataService,
        { provide: getRepositoryToken(OperationalData), useValue: operationalRepo },
        { provide: getRepositoryToken(MonitoringScorecard), useValue: scorecardRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: createMockRepo<AssessmentResponse>() },
        { provide: getRepositoryToken(StudentAttendance), useValue: createMockRepo<StudentAttendance>() },
        {
          provide: getRepositoryToken(StudentAcademicAssessment),
          useValue: createMockRepo<StudentAcademicAssessment>(),
        },
        { provide: getRepositoryToken(Student), useValue: createMockRepo<Student>() },
        { provide: getRepositoryToken(Staff), useValue: createMockRepo<Staff>() },
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

  describe('POST /data/operational', () => {
    it('records operational data', async () => {
      (operationalRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (operationalRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'data-1', ...entity }));

      const response = await request(app.getHttpServer())
        .post('/data/operational')
        .send({
          schoolId,
          dataType: DataType.FEE_DEFAULT,
          dataDate: '2026-03-15',
          dataValue: { count: 3 },
        })
        .expect(201);

      expect(response.body.id).toBe('data-1');
    });

    it('rejects an empty dataValue', async () => {
      await request(app.getHttpServer())
        .post('/data/operational')
        .send({ schoolId, dataType: DataType.FEE_DEFAULT, dataDate: '2026-03-15', dataValue: {} })
        .expect(400);
    });
  });

  describe('GET /data/operational', () => {
    it('requires schoolId, startDate, and endDate', async () => {
      await request(app.getHttpServer()).get(`/data/operational?schoolId=${schoolId}`).expect(400);
    });
  });

  describe('POST /data/scorecards', () => {
    it('generates scorecards from metric entries', async () => {
      (scorecardRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (scorecardRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      const response = await request(app.getHttpServer())
        .post('/data/scorecards')
        .send({
          schoolId,
          month: '2026-03-01',
          metrics: [{ metric: ScorecardMetric.STUDENT_RETENTION, targetValue: 100, achievedValue: 90 }],
        })
        .expect(201);

      expect(response.body[0].status).toBe('at_risk');
    });
  });

  describe('GET /data/retention/students', () => {
    it('requires schoolId and academicYear', async () => {
      await request(app.getHttpServer()).get('/data/retention/students').expect(400);
    });
  });

  describe('GET /data/academic-performance', () => {
    it('requires schoolId', async () => {
      await request(app.getHttpServer()).get('/data/academic-performance').expect(400);
    });
  });
});
