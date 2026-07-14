import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OperationalData,
  MonitoringScorecard,
  AssessmentResponse,
  StudentAttendance,
  StudentAcademicAssessment,
  Student,
  Staff,
} from 'src/database/entities';
import { DataService } from 'src/services/data.service';
import { DataController } from './data.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperationalData,
      MonitoringScorecard,
      AssessmentResponse,
      StudentAttendance,
      StudentAcademicAssessment,
      Student,
      Staff,
    ]),
  ],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
