import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiOperation } from '@nestjs/swagger';
import { WellbeingService } from '../../services/wellbeing.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Wellbeing')
@ApiBearerAuth()
@Controller('api/v2/wellbeing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ryl_admin', 'school_admin', 'teacher')
export class WellbeingController {
  constructor(private wellbeingService: WellbeingService) {}

  @Get('assessment/:studentId')
  async assessStudentWellbeing(@Param('studentId') studentId: string) {
    return this.wellbeingService.assessStudentWellbeing(studentId);
  }

  @Post('counsellor-referral')
  @HttpCode(HttpStatus.CREATED)
  async createCounsellorReferral(@Body() referralDto: any) {
    return this.wellbeingService.createCounsellorReferral(referralDto);
  }

  @Patch('counsellor-referral/:id')
  async updateCounsellorReferral(
    @Param('id') referralId: string,
    @Body() updateDto: any,
  ) {
    return this.wellbeingService.updateCounsellorReferral(referralId, updateDto);
  }

  @Post('intervention')
  @HttpCode(HttpStatus.CREATED)
  async createIntervention(@Body() interventionDto: any) {
    return this.wellbeingService.createIntervention(interventionDto);
  }

  @Patch('intervention/:id/complete')
  async completeIntervention(
    @Param('id') interventionId: string,
    @Body() completeDto: any,
  ) {
    return this.wellbeingService.completeIntervention(
      interventionId,
      completeDto.effectiveness,
      completeDto.notes,
    );
  }

  @Post('bullying-incident')
  @HttpCode(HttpStatus.CREATED)
  async recordBullyingIncident(@Body() incidentDto: any) {
    return this.wellbeingService.recordBullyingIncident(incidentDto);
  }

  @Patch('bullying-incident/:id/resolve')
  async resolveBullyingIncident(
    @Param('id') incidentId: string,
    @Body() resolveDto: any,
  ) {
    return this.wellbeingService.resolveBullyingIncident(
      incidentId,
      new Date(resolveDto.resolutionDate),
      resolveDto.resolutionNotes,
    );
  }

  @Get('dashboard/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getSchoolWellbeingDashboard(@Param('schoolId') schoolId: string) {
    return this.wellbeingService.getSchoolWellbeingDashboard(schoolId);
  }

  @Get('intervention-effectiveness/school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  async getInterventionEffectivenessReport(
    @Param('schoolId') schoolId: string,
  ) {
    return this.wellbeingService.getInterventionEffectivenessReport(schoolId);
  }
}
