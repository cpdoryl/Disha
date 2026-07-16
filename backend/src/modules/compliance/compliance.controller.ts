import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from 'src/services/compliance.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ComplaintSeverity } from 'src/database/entities';

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('api/v2/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Post('complaints')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Log a parent complaint' })
  async logComplaint(@Body() logDto: any) {
    return this.complianceService.logComplaint(logDto);
  }

  @Patch('complaints/:id/resolve')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiOperation({ summary: 'Resolve a complaint' })
  async resolveComplaint(
    @Param('id') id: string,
    @Body() body: { resolutionMethod: string; resolutionNotes?: string; parentSatisfactionRating?: number },
  ) {
    return this.complianceService.resolveComplaint(
      id,
      body.resolutionMethod,
      body.resolutionNotes,
      body.parentSatisfactionRating,
    );
  }

  @Get('complaints/school/:schoolId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'severity', required: false, enum: ComplaintSeverity })
  @ApiOperation({ summary: 'Get complaints by school' })
  async getComplaintsBySchool(
    @Param('schoolId') schoolId: string,
    @Query('severity') severity?: ComplaintSeverity,
  ) {
    return this.complianceService.getComplaintsBySchool(schoolId, severity);
  }

  @Get('complaints/school/:schoolId/summary')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get complaint summary for a school' })
  async getComplaintSummary(@Param('schoolId') schoolId: string) {
    return this.complianceService.getComplaintSummary(schoolId);
  }

  @Get('data-retention-policies')
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'List active data retention policies (DPDP/compliance)' })
  async getDataRetentionPolicies() {
    return this.complianceService.getDataRetentionPolicies();
  }
}
