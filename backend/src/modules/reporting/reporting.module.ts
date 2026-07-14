import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  School,
  Assessment,
  AssessmentResponse,
  Student,
  StudentAcademicAssessment,
  StudentAttendance,
} from 'src/database/entities';
import { ReportingService } from 'src/services/reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      Assessment,
      AssessmentResponse,
      Student,
      StudentAcademicAssessment,
      StudentAttendance,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
