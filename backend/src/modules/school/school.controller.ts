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
import { SchoolService } from '../../services/school.service';

@Controller('api/v2/schools')
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSchool(@Body() createSchoolDto: any) {
    return this.schoolService.createSchool(createSchoolDto);
  }

  @Get(':id')
  async getSchool(@Param('id') schoolId: string) {
    return this.schoolService.getSchool(schoolId);
  }

  @Patch(':id')
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
