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
import { DataService } from '../../services/data.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Data')
@ApiBearerAuth()
@Controller('api/v2/data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ryl_admin', 'school_admin', 'teacher')
export class DataController {
  constructor(private dataService: DataService) {}

  @Post('operational')
  @HttpCode(HttpStatus.CREATED)
  async recordOperationalData(@Body() dataDto: any) {
    return this.dataService.recordOperationalData(dataDto);
  }

  @Get('operational/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getOperationalDataForSchool(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dataService.getOperationalDataForSchool(
      schoolId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('scorecard')
  @UseGuards(SchoolScopeGuard)
  @HttpCode(HttpStatus.CREATED)
  async generateMonitoringScorecard(
    @Body() scorecardDto: any,
  ) {
    return this.dataService.generateMonitoringScorecard(
      scorecardDto.schoolId,
      new Date(scorecardDto.month),
      scorecardDto.metrics,
    );
  }

  @Get('scorecard/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getScorecardReport(
    @Param('schoolId') schoolId: string,
    @Query('startMonth') startMonth: string,
    @Query('endMonth') endMonth: string,
  ) {
    return this.dataService.getScorecardReport(
      schoolId,
      new Date(startMonth),
      new Date(endMonth),
    );
  }

  @Get('retention/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getStudentRetentionMetrics(
    @Param('schoolId') schoolId: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.dataService.getStudentRetentionMetrics(schoolId, academicYear);
  }

  @Get('teacher-retention/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getTeacherRetentionMetrics(
    @Param('schoolId') schoolId: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.dataService.getTeacherRetentionMetrics(schoolId, academicYear);
  }

  @Get('quality/assessment/:assessmentId')
  async getAssessmentResponseQualityMetrics(
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.dataService.getAssessmentResponseQualityMetrics(assessmentId);
  }

  @Get('academic-performance/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getAcademicPerformanceDistribution(
    @Param('schoolId') schoolId: string,
  ) {
    return this.dataService.getAcademicPerformanceDistribution(schoolId);
  }

  @Get('attendance-trend/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getAttendanceTrendAnalysis(
    @Param('schoolId') schoolId: string,
    @Query('months') months?: number,
  ) {
    return this.dataService.getAttendanceTrendAnalysis(schoolId, months);
  }
}
