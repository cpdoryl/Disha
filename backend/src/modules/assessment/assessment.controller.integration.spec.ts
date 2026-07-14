import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Assessment, AssessmentResponse, Question, AssessmentStatus } from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('AssessmentController (integration)', () => {
  let app: INestApplication;
  let assessmentRepo: MockRepo<Assessment>;

  beforeAll(async () => {
    assessmentRepo = createMockRepo<Assessment>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [
        AssessmentService,
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepo },
        { provide: getRepositoryToken(Question), useValue: createMockRepo<Question>() },
        { provide: getRepositoryToken(AssessmentResponse), useValue: createMockRepo<AssessmentResponse>() },
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

  it('is mounted at /assessments, not the stray /api/v2/assessments prefix', async () => {
    (assessmentRepo.create as jest.Mock).mockImplementation((entity) => entity);
    (assessmentRepo.save as jest.Mock).mockImplementation((entity) =>
      Promise.resolve({ id: 'assessment-1', ...entity }),
    );

    await request(app.getHttpServer())
      .post('/assessments/create')
      .send({ schoolId: '123e4567-e89b-12d3-a456-426614174000', cycleName: 'Term1_2026' })
      .expect(201);
  });

  it('rejects a create payload missing required fields', async () => {
    await request(app.getHttpServer()).post('/assessments/create').send({ cycleName: 'Term1_2026' }).expect(400);
  });

  it('rejects unknown fields on the create payload', async () => {
    await request(app.getHttpServer())
      .post('/assessments/create')
      .send({
        schoolId: '123e4567-e89b-12d3-a456-426614174000',
        cycleName: 'Term1_2026',
        notAField: 'nope',
      })
      .expect(400);
  });

  it('GET /assessments/health does not require auth', async () => {
    const response = await request(app.getHttpServer()).get('/assessments/health').expect(200);

    expect(response.body.status).toBe('Assessment API healthy');
  });

  it('PATCH /assessments/:id/status rejects an invalid status value', async () => {
    await request(app.getHttpServer())
      .patch('/assessments/assessment-1/status')
      .send({ status: 'not-a-real-status' })
      .expect(400);
  });

  it('PATCH /assessments/:id/status accepts a valid status transition', async () => {
    const assessment = { id: 'assessment-1', status: AssessmentStatus.DRAFT };
    (assessmentRepo.findOne as jest.Mock).mockResolvedValue(assessment);
    (assessmentRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

    const response = await request(app.getHttpServer())
      .patch('/assessments/assessment-1/status')
      .send({ status: AssessmentStatus.ACTIVE })
      .expect(200);

    expect(response.body.status).toBe(AssessmentStatus.ACTIVE);
  });
});
