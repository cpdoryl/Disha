import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { Assessment, Question, AssessmentResponse } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, Question, AssessmentResponse])],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
