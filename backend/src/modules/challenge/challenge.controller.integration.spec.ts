import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { Challenge, ChallengeCategory } from 'src/database/entities/challenge.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('ChallengeController (integration)', () => {
  let app: INestApplication;
  let repo: MockRepo<Challenge>;

  beforeAll(async () => {
    repo = createMockRepo<Challenge>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeController],
      providers: [ChallengeService, { provide: getRepositoryToken(Challenge), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /challenges returns the seeded challenge list', async () => {
    const challenges = [
      { id: 'c1', code: 'teacher_attrition', displayName: 'Teacher Attrition', category: ChallengeCategory.PEOPLE },
    ];
    (repo.find as jest.Mock).mockResolvedValue(challenges);

    const response = await request(app.getHttpServer()).get('/challenges').expect(200);

    expect(response.body).toEqual(challenges);
  });

  it('GET /challenges/by-category/:category filters by category', async () => {
    (repo.find as jest.Mock).mockResolvedValue([]);

    await request(app.getHttpServer()).get('/challenges/by-category/people').expect(200);

    expect(repo.find).toHaveBeenCalledWith({
      where: { category: 'people' },
      order: { displayName: 'ASC' },
    });
  });

  it('GET /challenges/:id returns 404 when the challenge is missing', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await request(app.getHttpServer()).get('/challenges/missing-id').expect(404);
  });

  it('POST /challenges/selected returns the matching challenges', async () => {
    const qb: any = {
      whereInIds: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await request(app.getHttpServer())
      .post('/challenges/selected')
      .send({ challengeIds: ['c1', 'c2'] })
      .expect(201);

    expect(qb.whereInIds).toHaveBeenCalledWith(['c1', 'c2']);
  });
});
