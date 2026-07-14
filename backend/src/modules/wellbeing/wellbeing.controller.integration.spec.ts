import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { WellbeingController } from './wellbeing.controller';
import { WellbeingService } from '../../services/wellbeing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CounsellorReferral,
  ReferralSeverity,
  RemediationIntervention,
  InterventionType,
  BullyingIncident,
  IncidentType,
  IncidentSeverity,
  Student,
} from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('WellbeingController (integration)', () => {
  let app: INestApplication;
  let studentRepo: MockRepo<Student>;
  let counsellorRepo: MockRepo<CounsellorReferral>;
  let interventionRepo: MockRepo<RemediationIntervention>;
  let bullyingRepo: MockRepo<BullyingIncident>;

  const schoolId = '123e4567-e89b-12d3-a456-426614174000';
  const studentId = '223e4567-e89b-42d3-a456-426614174000';

  beforeAll(async () => {
    studentRepo = createMockRepo<Student>();
    counsellorRepo = createMockRepo<CounsellorReferral>();
    interventionRepo = createMockRepo<RemediationIntervention>();
    bullyingRepo = createMockRepo<BullyingIncident>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [WellbeingController],
      providers: [
        WellbeingService,
        { provide: getRepositoryToken(CounsellorReferral), useValue: counsellorRepo },
        { provide: getRepositoryToken(RemediationIntervention), useValue: interventionRepo },
        { provide: getRepositoryToken(BullyingIncident), useValue: bullyingRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
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

  describe('GET /wellbeing/students/:studentId/assessment', () => {
    it('returns 404 when the student does not exist', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/wellbeing/students/${studentId}/assessment`).expect(404);
    });

    it('returns the aggregated risk assessment', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue({ id: studentId, schoolId });
      (counsellorRepo.find as jest.Mock).mockResolvedValue([]);
      (interventionRepo.find as jest.Mock).mockResolvedValue([]);
      (bullyingRepo.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/wellbeing/students/${studentId}/assessment`)
        .expect(200);

      expect(response.body.riskLevel).toBe('low');
    });
  });

  describe('POST /wellbeing/counsellor-referrals', () => {
    it('creates a referral', async () => {
      (counsellorRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (counsellorRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      await request(app.getHttpServer())
        .post('/wellbeing/counsellor-referrals')
        .send({ studentId, schoolId, reasonCode: 'anxiety', severity: ReferralSeverity.HIGH })
        .expect(201);
    });
  });

  describe('POST /wellbeing/interventions', () => {
    it('creates an intervention', async () => {
      (interventionRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (interventionRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      await request(app.getHttpServer())
        .post('/wellbeing/interventions')
        .send({
          schoolId,
          studentId,
          interventionType: InterventionType.COUNSELLING,
          interventionStartDate: '2026-02-01',
          interventionDetails: 'Weekly counselling sessions',
        })
        .expect(201);
    });
  });

  describe('PATCH /wellbeing/interventions/:id/complete', () => {
    it('rejects an out-of-range effectiveness value', async () => {
      await request(app.getHttpServer())
        .patch('/wellbeing/interventions/intervention-1/complete')
        .send({ effectiveness: 7 })
        .expect(400);
    });

    it('returns 404 when the intervention does not exist', async () => {
      (interventionRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/wellbeing/interventions/missing-id/complete')
        .send({ effectiveness: 4 })
        .expect(404);
    });
  });

  describe('POST /wellbeing/bullying-incidents', () => {
    it('records an incident', async () => {
      (bullyingRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (bullyingRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      await request(app.getHttpServer())
        .post('/wellbeing/bullying-incidents')
        .send({
          schoolId,
          incidentDate: '2026-02-10',
          incidentType: IncidentType.IN_PERSON,
          severity: IncidentSeverity.MODERATE,
          studentsInvolved: 2,
          actionTaken: 'Counselling scheduled',
        })
        .expect(201);
    });
  });

  describe('GET /wellbeing/schools/:schoolId/dashboard', () => {
    it('returns the school dashboard', async () => {
      (counsellorRepo.find as jest.Mock).mockResolvedValue([]);
      (interventionRepo.find as jest.Mock).mockResolvedValue([]);
      (bullyingRepo.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get(`/wellbeing/schools/${schoolId}/dashboard`).expect(200);

      expect(response.body.referrals.total).toBe(0);
    });
  });
});
