import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportingService } from '../../services/reporting.service';

@Controller('api/v2/reports')
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get('assessment/:assessmentId/summary')
  async getAssessmentSummary(@Param('assessmentId') assessmentId: string) {
    return this.reportingService.generateAssessmentSummaryReport(assessmentId);
  }

  @Get('school/:schoolId/performance')
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
  async getStudentProgress(@Param('studentId') studentId: string) {
    return this.reportingService.generateStudentProgressReport(studentId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportReport(@Body() exportDto: any) {
    return this.reportingService.exportReportToCSV(
      exportDto.reportType,
      exportDto.data,
    );
  }

  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  async scheduleReport(@Body() scheduleDto: any) {
    return this.reportingService.scheduleReport(
      scheduleDto.reportType,
      scheduleDto.schoolId,
      scheduleDto.frequency,
      scheduleDto.recipients,
    );
  }
}
