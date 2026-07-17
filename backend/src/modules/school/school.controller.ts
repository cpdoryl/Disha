import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SchoolService } from '../../services/school.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard, SchoolScope } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Schools')
@ApiBearerAuth()
@Controller('api/v2/schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin')
  @ApiOperation({ summary: 'Create school', description: 'Register a new school (RYL Admin only)' })
  async createSchool(@Body() createSchoolDto: any) {
    return this.schoolService.createSchool(createSchoolDto);
  }

  @Get(':id')
  @UseGuards(SchoolScopeGuard)
  @SchoolScope('id')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Get school details' })
  async getSchool(@Param('id') schoolId: string) {
    return this.schoolService.getSchool(schoolId);
  }

  @Patch(':id')
  @UseGuards(SchoolScopeGuard)
  @SchoolScope('id')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Update school details' })
  async updateSchool(@Param('id') schoolId: string, @Body() updateData: any) {
    return this.schoolService.updateSchool(schoolId, updateData);
  }

  @Get(':id/metrics')
  @UseGuards(SchoolScopeGuard)
  @SchoolScope('id')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Get school metrics' })
  async getSchoolMetrics(@Param('id') schoolId: string) {
    return this.schoolService.getSchoolMetrics(schoolId);
  }

  @Get('organization/:orgId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiOperation({ summary: 'Get schools by organization' })
  async getSchoolsByOrganization(@Param('orgId') organizationId: string) {
    return this.schoolService.getSchoolsByOrganization(organizationId);
  }

  @Get('district/:districtId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'districtId', description: 'District ID' })
  @ApiOperation({ summary: 'Get schools by district' })
  async getSchoolsByDistrict(@Param('districtId') districtId: string) {
    return this.schoolService.getSchoolsByDistrict(districtId);
  }

  @Patch(':id/deactivate')
  @Roles('ryl_admin')
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Deactivate school' })
  async deactivateSchool(@Param('id') schoolId: string) {
    await this.schoolService.deactivateSchool(schoolId);
    return { success: true, message: 'School deactivated' };
  }
}
