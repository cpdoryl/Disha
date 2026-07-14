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

@ApiTags('Schools')
@ApiBearerAuth()
@Controller('api/v2/schools')
@UseGuards(JwtAuthGuard)
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create school', description: 'Register a new school' })
  async createSchool(@Body() createSchoolDto: any) {
    return this.schoolService.createSchool(createSchoolDto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Get school details' })
  async getSchool(@Param('id') schoolId: string) {
    return this.schoolService.getSchool(schoolId);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Update school details' })
  async updateSchool(@Param('id') schoolId: string, @Body() updateData: any) {
    return this.schoolService.updateSchool(schoolId, updateData);
  }

  @Get(':id/metrics')
  async getSchoolMetrics(@Param('id') schoolId: string) {
    return this.schoolService.getSchoolMetrics(schoolId);
  }

  @Get('organization/:orgId')
  async getSchoolsByOrganization(@Param('orgId') organizationId: string) {
    return this.schoolService.getSchoolsByOrganization(organizationId);
  }

  @Get('district/:districtId')
  async getSchoolsByDistrict(@Param('districtId') districtId: string) {
    return this.schoolService.getSchoolsByDistrict(districtId);
  }

  @Patch(':id/deactivate')
  async deactivateSchool(@Param('id') schoolId: string) {
    await this.schoolService.deactivateSchool(schoolId);
    return { success: true, message: 'School deactivated' };
  }
}
