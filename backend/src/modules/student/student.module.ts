import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student, StudentAttendance, StudentAcademicAssessment, CounsellorReferral } from 'src/database/entities';
import { StudentService } from 'src/services/student.service';
import { StudentController } from './student.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Student, StudentAttendance, StudentAcademicAssessment, CounsellorReferral])],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
