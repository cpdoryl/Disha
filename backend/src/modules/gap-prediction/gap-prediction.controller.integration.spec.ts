import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { GapPredictionController } from './gap-prediction.controller';
import { GapPredictionService } from './gap-prediction.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GapPrediction } from '../../database/entities/gap-prediction.entity';
import { AssessmentResponse } from '../../database/entities/AssessmentResponse.entity';
import { Challenge, ChallengeCategory } from '../../database/entities/challenge.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('GapPredictionController (integration)', () => {
  let app: INestApplication;
  let gapRepo: MockRepo<GapPrediction>;
  let responseRepo: MockRepo<AssessmentResponse>;
  let challengeRepo: MockRepo<Challenge>;

  const schoolId = '123e4567-e89b-12d3-a456-426614174000';
  const challengeId = '223e4567-e89b-42d3-a456-426614174000';

  beforeAll(async () => {
    gapRepo = createMockRepo<GapPrediction>();
    responseRepo = createMockRepo<AssessmentResponse>();
    challengeRepo = createMockRepo<Challenge>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [GapPredictionController],
      providers: [
        GapPredictionService,
        { provide: getRepositoryToken(GapPrediction), useValue: gapRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: responseRepo },
        { provide: getRepositoryToken(Challenge), useValue: challengeRepo },
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

  describe('POST /gap-predictions/generate', () => {
    it('generates ranked priority gaps for the selected challenges', async () => {
      (challengeRepo.find as jest.Mock).mockResolvedValue([
        {
          id: challengeId,
          displayName: 'Teacher Attrition',
          category: ChallengeCategory.PEOPLE,
          questions: [{ id: 'q1' }],
        },
      ]);
      (responseRepo.find as jest.Mock).mockResolvedValue([{ questionId: 'q1', responseNumeric: 5 }]);
      (gapRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (gapRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      const response = await request(app.getHttpServer())
        .post('/gap-predictions/generate')
        .send({ schoolId, academicYear: '2026', selectedChallengeIds: [challengeId] })
        .expect(201);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].challengeId).toBe(challengeId);
      expect(response.body[0].priorityRank).toBe(1);
    });

    it('rejects an empty selectedChallengeIds array', async () => {
      await request(app.getHttpServer())
        .post('/gap-predictions/generate')
        .send({ schoolId, academicYear: '2026', selectedChallengeIds: [] })
        .expect(400);
    });

    it('rejects a non-UUID challenge id', async () => {
      await request(app.getHttpServer())
        .post('/gap-predictions/generate')
        .send({ schoolId, academicYear: '2026', selectedChallengeIds: ['not-a-uuid'] })
        .expect(400);
    });
  });

  describe('GET /gap-predictions', () => {
    it('requires both schoolId and academicYear', async () => {
      await request(app.getHttpServer()).get(`/gap-predictions?schoolId=${schoolId}`).expect(400);
    });

    it('returns previously generated gaps ordered by priority rank', async () => {
      (gapRepo.find as jest.Mock).mockResolvedValue([]);

      await request(app.getHttpServer()).get(`/gap-predictions?schoolId=${schoolId}&academicYear=2026`).expect(200);

      expect(gapRepo.find).toHaveBeenCalledWith({
        where: { schoolId, academicYear: '2026' },
        relations: ['challenge'],
        order: { priorityRank: 'ASC' },
      });
    });
  });
});
