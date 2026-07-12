import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from 'src/database/entities/assessment.entity';
import { Question } from 'src/database/entities/question.entity';
import { AssessmentResponse } from 'src/database/entities/assessment-response.entity';
import { Challenge } from 'src/database/entities/challenge.entity';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, Question, AssessmentResponse, Challenge])],
  providers: [AssessmentService],
  controllers: [AssessmentController],
  exports: [AssessmentService],
})
export class AssessmentModule {}
