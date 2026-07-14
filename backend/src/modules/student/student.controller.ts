import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StudentService } from '../../services/student.service';
import { Student, StudentAttendance, StudentAcademicAssessment, CounsellorReferral } from '../../database/entities';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
import { RecordAcademicAssessmentDto } from './dto/record-academic-assessment.dto';
import { ReferToCounsellorDto } from './dto/refer-to-counsellor.dto';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll a new student' })
  @ApiResponse({ status: 201, type: Student })
  async createStudent(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return this.studentService.createStudent({
      ...createStudentDto,
      dateOfBirth: new Date(createStudentDto.dateOfBirth),
    });
  }

  @Post('attendance')
  @ApiOperation({ summary: 'Record a student attendance entry' })
  @ApiResponse({ status: 201, type: StudentAttendance })
  async recordAttendance(@Body() recordAttendanceDto: RecordAttendanceDto): Promise<StudentAttendance> {
    return this.studentService.recordAttendance({
      ...recordAttendanceDto,
      attendanceDate: new Date(recordAttendanceDto.attendanceDate),
    });
  }

  @Post('academic-assessments')
  @ApiOperation({ summary: 'Record a student academic assessment result' })
  @ApiResponse({ status: 201, type: StudentAcademicAssessment })
  async recordAcademicAssessment(
    @Body() recordAcademicAssessmentDto: RecordAcademicAssessmentDto,
  ): Promise<StudentAcademicAssessment> {
    return this.studentService.recordAcademicAssessment({
      ...recordAcademicAssessmentDto,
      assessmentDate: new Date(recordAcademicAssessmentDto.assessmentDate),
    });
  }

  @Post('counsellor-referrals')
  @ApiOperation({ summary: 'Refer a student to the school counsellor' })
  @ApiResponse({ status: 201, type: CounsellorReferral })
  async referToCounsellor(@Body() referToCounsellorDto: ReferToCounsellorDto): Promise<CounsellorReferral> {
    return this.studentService.referToCounsellor(referToCounsellorDto);
  }

  @Get('risk-profile')
  @ApiOperation({ summary: 'Get a school-wide student risk profile' })
  @ApiResponse({ status: 200 })
  async getStudentRiskProfile(@Query('schoolId') schoolId: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.studentService.getStudentRiskProfile(schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'List active students for a school' })
  @ApiResponse({ status: 200, type: [Student] })
  async getStudentsBySchool(@Query('schoolId') schoolId: string): Promise<Student[]> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.studentService.getStudentsBySchool(schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by id' })
  @ApiResponse({ status: 200, type: Student })
  async getStudent(@Param('id') id: string): Promise<Student> {
    const student = await this.studentService.getStudent(id);
    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    return student;
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get an attendance summary for a student over a date range' })
  @ApiResponse({ status: 200 })
  async getAttendanceReport(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query parameters are required');
    }
    return this.studentService.getAttendanceReport(id, new Date(startDate), new Date(endDate));
  }

  @Get(':id/academic-assessments')
  @ApiOperation({ summary: 'Get academic assessment history for a student' })
  @ApiResponse({ status: 200, type: [StudentAcademicAssessment] })
  async getAcademicPerformance(
    @Param('id') id: string,
    @Query('term') term?: string,
  ): Promise<StudentAcademicAssessment[]> {
    return this.studentService.getAcademicPerformance(id, term);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a student status (e.g. mark as withdrawn)' })
  @ApiResponse({ status: 200, type: Student })
  async updateStudentStatus(
    @Param('id') id: string,
    @Body() updateStudentStatusDto: UpdateStudentStatusDto,
  ): Promise<Student> {
    const student = await this.studentService.updateStudentStatus(
      id,
      updateStudentStatusDto.status,
      updateStudentStatusDto.reason,
    );
    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    return student;
  }
}
