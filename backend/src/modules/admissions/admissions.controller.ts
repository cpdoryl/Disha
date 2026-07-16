import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdmissionsService } from 'src/services/admissions.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdmissionStatus } from 'src/database/entities';

@ApiTags('Admissions')
@ApiBearerAuth()
@Controller('api/v2/admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private admissionsService: AdmissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Create admission inquiry' })
  async createAdmission(@Body() createAdmissionDto: any) {
    return this.admissionsService.createAdmission(createAdmissionDto);
  }

  @Get(':id')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Admission ID' })
  @ApiOperation({ summary: 'Get admission details' })
  async getAdmission(@Param('id') admissionId: string) {
    return this.admissionsService.getAdmission(admissionId);
  }

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'status', required: false, enum: AdmissionStatus })
  @ApiOperation({ summary: 'Get admissions by school' })
  async getAdmissionsBySchool(
    @Param('schoolId') schoolId: string,
    @Query('status') status?: AdmissionStatus,
  ) {
    return this.admissionsService.getAdmissionsBySchool(schoolId, status);
  }

  @Get('school/:schoolId/funnel')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get admission funnel summary by status' })
  async getFunnelSummary(@Param('schoolId') schoolId: string) {
    return this.admissionsService.getFunnelSummary(schoolId);
  }

  @Patch(':id/status')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Admission ID' })
  @ApiOperation({ summary: 'Update admission status' })
  async updateStatus(
    @Param('id') admissionId: string,
    @Body() body: { status: AdmissionStatus; interviewDate?: string; interviewScore?: number },
  ) {
    return this.admissionsService.updateStatus(admissionId, body.status, {
      interviewDate: body.interviewDate,
      interviewScore: body.interviewScore,
    });
  }
}
