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
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
