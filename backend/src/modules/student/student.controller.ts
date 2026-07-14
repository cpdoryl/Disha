import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentService } from '../../services/student.service';

@Controller('api/v2/students')
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStudent(@Body() createStudentDto: any) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Get(':id')
  async getStudent(@Param('id') studentId: string) {
    return this.studentService.getStudent(studentId);
  }

  @Get('school/:schoolId')
  async getStudentsBySchool(@Param('schoolId') schoolId: string) {
    return this.studentService.getStudentsBySchool(schoolId);
  }

  @Patch(':id/status')
  async updateStudentStatus(
    @Param('id') studentId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.studentService.updateStudentStatus(
      studentId,
      body.status as any,
      body.reason,
    );
  }

  @Post(':id/attendance')
  @HttpCode(HttpStatus.CREATED)
  async recordAttendance(
    @Param('id') studentId: string,
    @Body() attendanceDto: any,
  ) {
    return this.studentService.recordAttendance({
      studentId,
      ...attendanceDto,
    });
  }

  @Get(':id/attendance/report')
  async getAttendanceReport(
    @Param('id') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.studentService.getAttendanceReport(
      studentId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post(':id/academic-assessment')
  @HttpCode(HttpStatus.CREATED)
  async recordAcademicAssessment(
    @Param('id') studentId: string,
    @Body() assessmentDto: any,
  ) {
    return this.studentService.recordAcademicAssessment({
      studentId,
      ...assessmentDto,
    });
  }

  @Get(':id/academic-performance')
  async getAcademicPerformance(
    @Param('id') studentId: string,
    @Query('term') term?: string,
  ) {
    return this.studentService.getAcademicPerformance(studentId, term);
  }

  @Post(':id/counsellor-referral')
  @HttpCode(HttpStatus.CREATED)
  async referToCounsellor(
    @Param('id') studentId: string,
    @Body() referralDto: any,
  ) {
    return this.studentService.referToCounsellor({
      studentId,
      ...referralDto,
    });
  }

  @Get('school/:schoolId/risk-profile')
  async getStudentRiskProfile(@Param('schoolId') schoolId: string) {
    return this.studentService.getStudentRiskProfile(schoolId);
  }
}
