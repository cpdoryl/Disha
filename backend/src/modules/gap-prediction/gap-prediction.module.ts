import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GapPrediction } from 'src/database/entities/gap-prediction.entity';
import { AssessmentResponse } from 'src/database/entities/AssessmentResponse.entity';
import { Challenge } from 'src/database/entities/challenge.entity';
import { GapPredictionService } from './gap-prediction.service';
import { GapPredictionController } from './gap-prediction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GapPrediction, AssessmentResponse, Challenge])],
  controllers: [GapPredictionController],
  providers: [GapPredictionService],
  exports: [GapPredictionService],
})
export class GapPredictionModule {}
