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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StudentService } from '../../services/student.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('api/v2/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Create student' })
  async createStudent(@Body() createStudentDto: any) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Get(':id')
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent', 'student')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Get student details' })
  async getStudent(@Param('id') studentId: string) {
    return this.studentService.getStudent(studentId);
  }

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get students by school' })
  async getStudentsBySchool(@Param('schoolId') schoolId: string) {
    return this.studentService.getStudentsBySchool(schoolId);
  }

  @Patch(':id/status')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Update student status' })
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
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Record student attendance' })
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
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Get attendance report' })
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
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Record academic assessment' })
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
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Get academic performance' })
  async getAcademicPerformance(
    @Param('id') studentId: string,
    @Query('term') term?: string,
  ) {
    return this.studentService.getAcademicPerformance(studentId, term);
  }

  @Post(':id/counsellor-referral')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: 'Refer student to counsellor' })
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
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get student risk profiles' })
  async getStudentRiskProfile(@Param('schoolId') schoolId: string) {
    return this.studentService.getStudentRiskProfile(schoolId);
  }
}
