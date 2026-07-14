import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DataService } from '../../services/data.service';
import { OperationalData, MonitoringScorecard } from '../../database/entities';
import { RecordOperationalDataDto } from './dto/record-operational-data.dto';
import { GenerateMonitoringScorecardDto } from './dto/generate-monitoring-scorecard.dto';

@ApiTags('Operational Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('operational')
  @ApiOperation({ summary: 'Record a piece of operational data for a school' })
  @ApiResponse({ status: 201, type: OperationalData })
  async recordOperationalData(@Body() dto: RecordOperationalDataDto): Promise<OperationalData> {
    return this.dataService.recordOperationalData({ ...dto, dataDate: new Date(dto.dataDate) });
  }

  @Get('operational')
  @ApiOperation({ summary: 'Get operational data for a school within a date range' })
  @ApiResponse({ status: 200, type: [OperationalData] })
  async getOperationalDataForSchool(
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<OperationalData[]> {
    if (!schoolId || !startDate || !endDate) {
      throw new BadRequestException('schoolId, startDate, and endDate query parameters are required');
    }
    return this.dataService.getOperationalDataForSchool(schoolId, new Date(startDate), new Date(endDate));
  }

  @Post('scorecards')
  @ApiOperation({ summary: 'Generate monitoring scorecard entries for a school and month' })
  @ApiResponse({ status: 201, type: [MonitoringScorecard] })
  async generateMonitoringScorecard(@Body() dto: GenerateMonitoringScorecardDto): Promise<MonitoringScorecard[]> {
    return this.dataService.generateMonitoringScorecard(dto.schoolId, new Date(dto.month), dto.metrics);
  }

  @Get('scorecards')
  @ApiOperation({ summary: 'Get monitoring scorecards for a school within a month range' })
  @ApiResponse({ status: 200, type: [MonitoringScorecard] })
  async getScorecardReport(
    @Query('schoolId') schoolId: string,
    @Query('startMonth') startMonth: string,
    @Query('endMonth') endMonth: string,
  ): Promise<MonitoringScorecard[]> {
    if (!schoolId || !startMonth || !endMonth) {
      throw new BadRequestException('schoolId, startMonth, and endMonth query parameters are required');
    }
    return this.dataService.getScorecardReport(schoolId, new Date(startMonth), new Date(endMonth));
  }

  @Get('retention/students')
  @ApiOperation({ summary: 'Get student retention metrics for a school and academic year' })
  @ApiResponse({ status: 200 })
  async getStudentRetentionMetrics(@Query('schoolId') schoolId: string, @Query('academicYear') academicYear: string) {
    if (!schoolId || !academicYear) {
      throw new BadRequestException('schoolId and academicYear query parameters are required');
    }
    return this.dataService.getStudentRetentionMetrics(schoolId, academicYear);
  }

  @Get('retention/staff')
  @ApiOperation({ summary: 'Get teacher retention metrics for a school and academic year' })
  @ApiResponse({ status: 200 })
  async getTeacherRetentionMetrics(@Query('schoolId') schoolId: string, @Query('academicYear') academicYear: string) {
    if (!schoolId || !academicYear) {
      throw new BadRequestException('schoolId and academicYear query parameters are required');
    }
    return this.dataService.getTeacherRetentionMetrics(schoolId, academicYear);
  }

  @Get('academic-performance')
  @ApiOperation({ summary: 'Get academic performance distribution for a school' })
  @ApiResponse({ status: 200 })
  async getAcademicPerformanceDistribution(@Query('schoolId') schoolId: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.dataService.getAcademicPerformanceDistribution(schoolId);
  }

  @Get('attendance-trend')
  @ApiOperation({ summary: 'Get attendance trend analysis for a school over recent months' })
  @ApiResponse({ status: 200 })
  async getAttendanceTrendAnalysis(@Query('schoolId') schoolId: string, @Query('months') months?: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }
    return this.dataService.getAttendanceTrendAnalysis(schoolId, months ? parseInt(months, 10) : undefined);
  }

  @Get('assessment-quality/:assessmentId')
  @ApiOperation({ summary: 'Get response quality metrics for an assessment' })
  @ApiResponse({ status: 200 })
  async getAssessmentResponseQualityMetrics(@Param('assessmentId') assessmentId: string) {
    return this.dataService.getAssessmentResponseQualityMetrics(assessmentId);
  }
}
