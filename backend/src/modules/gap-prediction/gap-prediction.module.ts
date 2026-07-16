import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentResponse, GapPrediction, Challenge } from 'src/database/entities';
import { GapPredictionService } from './gap-prediction.service';
import { GapPredictionController } from './gap-prediction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GapPrediction, AssessmentResponse, Challenge])],
  controllers: [GapPredictionController],
  providers: [GapPredictionService],
  exports: [GapPredictionService],
})
export class GapPredictionModule {}
