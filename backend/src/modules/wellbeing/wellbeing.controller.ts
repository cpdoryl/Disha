import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WellbeingService } from '../../services/wellbeing.service';
import { CreateCounsellorReferralDto } from './dto/create-counsellor-referral.dto';
import { UpdateCounsellorReferralDto } from './dto/update-counsellor-referral.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { CompleteInterventionDto } from './dto/complete-intervention.dto';
import { RecordBullyingIncidentDto } from './dto/record-bullying-incident.dto';
import { ResolveBullyingIncidentDto } from './dto/resolve-bullying-incident.dto';

/**
 * Note: student wellbeing data (counsellor referrals, bullying incidents)
 * is sensitive. This controller only checks that the caller is
 * authenticated - it does not yet restrict access to a counsellor-only
 * role, since there's no RBAC layer in the app yet.
 */
@ApiTags('Wellbeing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wellbeing')
export class WellbeingController {
  constructor(private readonly wellbeingService: WellbeingService) {}

  @Get('students/:studentId/assessment')
  @ApiOperation({ summary: 'Get an aggregated wellbeing risk assessment for a student' })
  @ApiResponse({ status: 200 })
  async assessStudentWellbeing(@Param('studentId') studentId: string) {
    return this.wellbeingService.assessStudentWellbeing(studentId);
  }

  @Post('counsellor-referrals')
  @ApiOperation({ summary: 'Refer a student to the school counsellor' })
  @ApiResponse({ status: 201 })
  async createCounsellorReferral(@Body() dto: CreateCounsellorReferralDto) {
    return this.wellbeingService.createCounsellorReferral(dto);
  }

  @Patch('counsellor-referrals/:id')
  @ApiOperation({ summary: 'Update a counsellor referral' })
  @ApiResponse({ status: 200 })
  async updateCounsellorReferral(@Param('id') id: string, @Body() dto: UpdateCounsellorReferralDto) {
    return this.wellbeingService.updateCounsellorReferral(id, {
      ...dto,
      resolutionDate: dto.resolutionDate ? new Date(dto.resolutionDate) : undefined,
    });
  }

  @Post('interventions')
  @ApiOperation({ summary: 'Create a remediation intervention for a student' })
  @ApiResponse({ status: 201 })
  async createIntervention(@Body() dto: CreateInterventionDto) {
    return this.wellbeingService.createIntervention({
      ...dto,
      interventionStartDate: new Date(dto.interventionStartDate),
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
    });
  }

  @Patch('interventions/:id/complete')
  @ApiOperation({ summary: 'Mark an intervention as complete with an effectiveness rating' })
  @ApiResponse({ status: 200 })
  async completeIntervention(@Param('id') id: string, @Body() dto: CompleteInterventionDto) {
    return this.wellbeingService.completeIntervention(id, dto.effectiveness, dto.notes);
  }

  @Post('bullying-incidents')
  @ApiOperation({ summary: 'Record a bullying incident' })
  @ApiResponse({ status: 201 })
  async recordBullyingIncident(@Body() dto: RecordBullyingIncidentDto) {
    return this.wellbeingService.recordBullyingIncident({
      ...dto,
      incidentDate: new Date(dto.incidentDate),
    });
  }

  @Patch('bullying-incidents/:id/resolve')
  @ApiOperation({ summary: 'Resolve a bullying incident' })
  @ApiResponse({ status: 200 })
  async resolveBullyingIncident(@Param('id') id: string, @Body() dto: ResolveBullyingIncidentDto) {
    return this.wellbeingService.resolveBullyingIncident(id, new Date(dto.resolutionDate), dto.resolutionNotes);
  }

  @Get('schools/:schoolId/dashboard')
  @ApiOperation({ summary: 'Get a school-wide wellbeing dashboard' })
  @ApiResponse({ status: 200 })
  async getSchoolWellbeingDashboard(@Param('schoolId') schoolId: string) {
    return this.wellbeingService.getSchoolWellbeingDashboard(schoolId);
  }

  @Get('schools/:schoolId/intervention-effectiveness')
  @ApiOperation({ summary: 'Get an intervention effectiveness report for a school' })
  @ApiResponse({ status: 200 })
  async getInterventionEffectivenessReport(@Param('schoolId') schoolId: string) {
    return this.wellbeingService.getInterventionEffectivenessReport(schoolId);
  }
}
