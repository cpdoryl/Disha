import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Student,
  StudentAttendance,
  StudentAcademicAssessment,
  CounsellorReferral,
} from 'src/database/entities';
import { StudentService } from 'src/services/student.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      StudentAttendance,
      StudentAcademicAssessment,
      CounsellorReferral,
    ]),
  ],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
