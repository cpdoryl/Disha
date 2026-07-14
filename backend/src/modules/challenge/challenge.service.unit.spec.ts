import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengeService } from './challenge.service';
import { Challenge, ChallengeCategory, PREDEFINED_CHALLENGES } from 'src/database/entities/challenge.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let repo: MockRepo<Challenge>;

  beforeEach(async () => {
    repo = createMockRepo<Challenge>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChallengeService, { provide: getRepositoryToken(Challenge), useValue: repo }],
    }).compile();

    service = module.get(ChallengeService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('seedPredefinedChallenges', () => {
    it('does nothing when challenges already exist', async () => {
      (repo.count as jest.Mock).mockResolvedValue(3);

      await service.seedPredefinedChallenges();

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('seeds all predefined challenges when the table is empty', async () => {
      (repo.count as jest.Mock).mockResolvedValue(0);
      (repo.create as jest.Mock).mockImplementation((c) => c);
      (repo.save as jest.Mock).mockResolvedValue([]);

      await service.seedPredefinedChallenges();

      expect(repo.create).toHaveBeenCalledTimes(PREDEFINED_CHALLENGES.length);
      expect(repo.save).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ code: PREDEFINED_CHALLENGES[0].code })]),
      );
    });
  });

  describe('getAllChallenges', () => {
    it('orders by category then display name', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      await service.getAllChallenges();

      expect(repo.find).toHaveBeenCalledWith({
        order: { category: 'ASC', displayName: 'ASC' },
      });
    });
  });

  describe('getChallengesByCategory', () => {
    it('filters by category', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      await service.getChallengesByCategory(ChallengeCategory.PEOPLE);

      expect(repo.find).toHaveBeenCalledWith({
        where: { category: ChallengeCategory.PEOPLE },
        order: { displayName: 'ASC' },
      });
    });
  });

  describe('getChallengeById', () => {
    it('returns the challenge with its questions', async () => {
      const challenge = { id: 'c1' } as Challenge;
      (repo.findOne as jest.Mock).mockResolvedValue(challenge);

      const result = await service.getChallengeById('c1');

      expect(result).toBe(challenge);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'c1' }, relations: ['questions'] });
    });

    it('throws NotFoundException when the challenge does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getChallengeById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChallengeByCode', () => {
    it('throws NotFoundException when the code does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getChallengeByCode('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSelectedChallenges', () => {
    it('builds a query filtered to the requested ids', async () => {
      const qb: any = {
        whereInIds: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.getSelectedChallenges(['a', 'b']);

      expect(qb.whereInIds).toHaveBeenCalledWith(['a', 'b']);
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('challenge.questions', 'questions');
    });
  });
});
