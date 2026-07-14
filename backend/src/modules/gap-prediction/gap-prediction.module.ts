import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentResponse, GapPrediction, Challenge } from 'src/database/entities';
import { GapPredictionService } from './gap-prediction.service';

@Module({
  imports: [TypeOrmModule.forFeature([GapPrediction, AssessmentResponse, Challenge])],
  providers: [GapPredictionService],
  exports: [GapPredictionService],
})
export class GapPredictionModule {}
