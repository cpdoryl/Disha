import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { Challenge } from 'src/database/entities/challenge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge])],
  providers: [ChallengeService],
  controllers: [ChallengeController],
  exports: [ChallengeService],
})
export class ChallengeModule implements OnModuleInit {
  constructor(private challengeService: ChallengeService) {}

  async onModuleInit() {
    // Seed predefined challenges on startup
    await this.challengeService.seedPredefinedChallenges();
  }
}
