import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiOperation } from '@nestjs/swagger';
import { ReportingService } from '../../services/reporting.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('api/v2/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('assessment/:assessmentId/summary')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiOperation({ summary: 'Get assessment summary report' })
  async getAssessmentSummary(@Param('assessmentId') assessmentId: string) {
    return this.reportingService.generateAssessmentSummaryReport(assessmentId);
  }

  @Get('school/:schoolId/performance')
  @UseGuards(SchoolScopeGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get school performance report' })
  async getSchoolPerformance(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.generateSchoolPerformanceReport(
      schoolId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('student/:studentId/progress')
  @Roles('ryl_admin', 'school_admin', 'teacher', 'parent')
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiOperation({ summary: 'Get student progress report' })
  async getStudentProgress(@Param('studentId') studentId: string) {
    return this.reportingService.generateStudentProgressReport(studentId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Export report to CSV' })
  async exportReport(@Body() exportDto: any) {
    return this.reportingService.exportReportToCSV(
      exportDto.reportType,
      exportDto.data,
    );
  }

  @Post('schedule')
  @UseGuards(SchoolScopeGuard)
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Schedule report generation' })
  async scheduleReport(@Body() scheduleDto: any) {
    return this.reportingService.scheduleReport(
      scheduleDto.reportType,
      scheduleDto.schoolId,
      scheduleDto.frequency,
      scheduleDto.recipients,
    );
  }
}
