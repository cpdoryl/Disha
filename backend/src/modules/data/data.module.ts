import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OperationalData,
  MonitoringScorecard,
  AssessmentResponse,
  StudentAttendance,
  StudentAcademicAssessment,
} from 'src/database/entities';
import { DataService } from 'src/services/data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperationalData,
      MonitoringScorecard,
      AssessmentResponse,
      StudentAttendance,
      StudentAcademicAssessment,
    ]),
  ],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
