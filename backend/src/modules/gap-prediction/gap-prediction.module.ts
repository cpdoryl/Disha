import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentResponse } from 'src/database/entities';
import { GapPrediction } from 'src/database/entities/gap-prediction.entity';
import { Challenge } from 'src/database/entities/challenge.entity';
import { GapPredictionService } from './gap-prediction.service';

@Module({
  imports: [TypeOrmModule.forFeature([GapPrediction, AssessmentResponse, Challenge])],
  providers: [GapPredictionService],
  exports: [GapPredictionService],
})
export class GapPredictionModule {}
