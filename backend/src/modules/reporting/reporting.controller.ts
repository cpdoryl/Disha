import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportingService } from '../../services/reporting.service';
import { ExportReportDto } from './dto/export-report.dto';
import { ScheduleReportDto } from './dto/schedule-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('assessments/:assessmentId/summary')
  @ApiOperation({ summary: 'Get an assessment summary report' })
  @ApiResponse({ status: 200 })
  async generateAssessmentSummaryReport(@Param('assessmentId') assessmentId: string) {
    return this.reportingService.generateAssessmentSummaryReport(assessmentId);
  }

  @Get('schools/:schoolId/performance')
  @ApiOperation({ summary: 'Get a school performance report over a date range' })
  @ApiResponse({ status: 200 })
  async generateSchoolPerformanceReport(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query parameters are required');
    }
    return this.reportingService.generateSchoolPerformanceReport(schoolId, new Date(startDate), new Date(endDate));
  }

  @Get('students/:studentId/progress')
  @ApiOperation({ summary: 'Get a student progress report' })
  @ApiResponse({ status: 200 })
  async generateStudentProgressReport(@Param('studentId') studentId: string) {
    return this.reportingService.generateStudentProgressReport(studentId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export report data as CSV' })
  @ApiResponse({ status: 201, description: 'CSV text' })
  async exportReportToCSV(@Body() dto: ExportReportDto): Promise<{ csv: string }> {
    const csv = await this.reportingService.exportReportToCSV(dto.reportType, dto.data);
    return { csv };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a recurring report' })
  @ApiResponse({ status: 201 })
  async scheduleReport(@Body() dto: ScheduleReportDto) {
    return this.reportingService.scheduleReport(dto.reportType, dto.schoolId, dto.frequency, dto.recipients);
  }
}
