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
import { CurrentUser, AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
import { GuardianRelationship } from 'src/database/entities';

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

  @Get('me')
  @Roles('student')
  @ApiOperation({ summary: "Get the logged-in student user's own student record" })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getMyProfile(user.userId);
  }

  @Get('me/children')
  @Roles('parent')
  @ApiOperation({ summary: "Get the logged-in parent user's linked children" })
  async getMyChildren(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getMyChildren(user.userId);
  }

  @Get('me/attendance/report')
  @Roles('student')
  @ApiOperation({ summary: "Get the logged-in student's own attendance report" })
  async getMyAttendanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.studentService.getMyAttendanceReport(user.userId, new Date(startDate), new Date(endDate));
  }

  @Get('me/academic-performance')
  @Roles('student')
  @ApiOperation({ summary: "Get the logged-in student's own academic performance" })
  async getMyAcademicPerformance(@CurrentUser() user: AuthenticatedUser, @Query('term') term?: string) {
    return this.studentService.getMyAcademicPerformance(user.userId, term);
  }

  @Patch(':id/link-user')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: "Link a student's own login account to their student record" })
  async linkUserToStudent(@Param('id') studentId: string, @Body() body: { userId: string }) {
    return this.studentService.linkUserToStudent(studentId, body.userId);
  }

  @Post(':id/parents')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiOperation({ summary: "Link a parent's login account to a student record" })
  async linkParentToStudent(
    @Param('id') studentId: string,
    @Body() body: { parentUserId: string; relationship?: GuardianRelationship },
  ) {
    return this.studentService.linkParentToStudent(studentId, body.parentUserId, body.relationship);
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
