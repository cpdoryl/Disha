import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GapPredictionService } from './gap-prediction.service';
import { GapPrediction, ConfidenceTier } from 'src/database/entities/gap-prediction.entity';
import { AssessmentResponse } from 'src/database/entities/AssessmentResponse.entity';
import { Challenge, ChallengeCategory } from 'src/database/entities/challenge.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('GapPredictionService', () => {
  let service: GapPredictionService;
  let gapRepo: MockRepo<GapPrediction>;
  let responseRepo: MockRepo<AssessmentResponse>;
  let challengeRepo: MockRepo<Challenge>;

  // Each fixture challenge owns exactly one question, `${id}-q1`, so
  // responses can be routed to a challenge via questionId.
  const challenge = (id: string, displayName: string): Challenge =>
    ({
      id,
      displayName,
      code: id,
      category: ChallengeCategory.PEOPLE,
      description: '',
      questions: [{ id: `${id}-q1` }],
    }) as Challenge;

  const response = (questionId: string, responseNumeric: number): AssessmentResponse =>
    ({ questionId, responseNumeric }) as AssessmentResponse;

  beforeEach(async () => {
    gapRepo = createMockRepo<GapPrediction>();
    responseRepo = createMockRepo<AssessmentResponse>();
    challengeRepo = createMockRepo<Challenge>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GapPredictionService,
        { provide: getRepositoryToken(GapPrediction), useValue: gapRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: responseRepo },
        { provide: getRepositoryToken(Challenge), useValue: challengeRepo },
      ],
    }).compile();

    service = module.get(GapPredictionService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('generatePriorityGaps', () => {
    it('ranks challenges by combined score and returns at most 3 results', async () => {
      const challenges = [
        challenge('c1', 'Teacher Attrition'),
        challenge('c2', 'Fee Collection'),
        challenge('c3', 'Brand Reputation'),
        challenge('c4', 'Infrastructure Gaps'),
      ];
      (challengeRepo.find as jest.Mock).mockResolvedValue(challenges);
      (responseRepo.find as jest.Mock).mockResolvedValue([
        response('c1-q1', 5),
        response('c1-q1', 5),
        response('c2-q1', 1),
        response('c4-q1', 3),
      ]);
      (gapRepo.create as jest.Mock).mockImplementation((entity) => entity as GapPrediction);
      (gapRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      const results = await service.generatePriorityGaps('school-1', '2026', ['c1', 'c2', 'c3', 'c4']);

      expect(results).toHaveLength(3);
      expect(results[0].challengeId).toBe('c1');
      expect(results[0].priorityRank).toBe(1);
      expect(results[0].selfReportedSeverity).toBe(1);
      expect(results[1].priorityRank).toBe(2);
    });

    it('only queries responses for questions belonging to the selected challenges', async () => {
      (challengeRepo.find as jest.Mock).mockResolvedValue([challenge('c1', 'Teacher Attrition')]);
      (responseRepo.find as jest.Mock).mockResolvedValue([]);
      (gapRepo.create as jest.Mock).mockImplementation((entity) => entity as GapPrediction);
      (gapRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      await service.generatePriorityGaps('school-1', '2026', ['c1']);

      expect(responseRepo.find).toHaveBeenCalledWith({
        where: { schoolId: 'school-1', questionId: expect.anything() },
      });
    });

    it('skips challenge ids that are not found', async () => {
      (challengeRepo.find as jest.Mock).mockResolvedValue([challenge('c1', 'Teacher Attrition')]);
      (responseRepo.find as jest.Mock).mockResolvedValue([response('c1-q1', 4)]);
      (gapRepo.create as jest.Mock).mockImplementation((entity) => entity as GapPrediction);
      (gapRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      const results = await service.generatePriorityGaps('school-1', '2026', ['c1', 'unknown']);

      expect(results).toHaveLength(1);
      expect(results[0].challengeId).toBe('c1');
    });

    it('defaults to tier C confidence for Phase 1 (only survey data available)', async () => {
      (challengeRepo.find as jest.Mock).mockResolvedValue([challenge('c1', 'Teacher Attrition')]);
      (responseRepo.find as jest.Mock).mockResolvedValue([]);
      let savedGap: Partial<GapPrediction> | undefined;
      (gapRepo.create as jest.Mock).mockImplementation((entity) => {
        savedGap = entity;
        return entity as GapPrediction;
      });
      (gapRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      await service.generatePriorityGaps('school-1', '2026', ['c1']);

      expect(savedGap?.confidenceTier).toBe(ConfidenceTier.TIER_C);
    });
  });

  describe('getSchoolGaps', () => {
    it('filters by school and academic year, ordered by priority rank', async () => {
      (gapRepo.find as jest.Mock).mockResolvedValue([]);

      await service.getSchoolGaps('school-1', '2026');

      expect(gapRepo.find).toHaveBeenCalledWith({
        where: { schoolId: 'school-1', academicYear: '2026' },
        relations: ['challenge'],
        order: { priorityRank: 'ASC' },
      });
    });
  });
});
