import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge, PREDEFINED_CHALLENGES } from 'src/database/entities/challenge.entity';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  async seedPredefinedChallenges(): Promise<void> {
    const existing = await this.challengeRepository.count();
    if (existing > 0) return;

    const challenges = PREDEFINED_CHALLENGES.map((challenge) =>
      this.challengeRepository.create(challenge),
    );

    await this.challengeRepository.save(challenges);
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return this.challengeRepository.find({
      order: { category: 'ASC', displayName: 'ASC' },
    });
  }

  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    return this.challengeRepository.find({
      where: { category },
      order: { displayName: 'ASC' },
    });
  }

  async getChallengeById(id: string): Promise<Challenge> {
    return this.challengeRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  async getChallengeByCode(code: string): Promise<Challenge> {
    return this.challengeRepository.findOne({
      where: { code },
      relations: ['questions'],
    });
  }

  async getSelectedChallenges(challengeIds: string[]): Promise<Challenge[]> {
    return this.challengeRepository
      .createQueryBuilder('challenge')
      .whereInIds(challengeIds)
      .leftJoinAndSelect('challenge.questions', 'questions')
      .orderBy('challenge.category', 'ASC')
      .addOrderBy('challenge.displayName', 'ASC')
      .getMany();
  }
}
