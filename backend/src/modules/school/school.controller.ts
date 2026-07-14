import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolService } from '../../services/school.service';
import { School, District } from '../../database/entities';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateDistrictDto } from './dto/create-district.dto';

@ApiTags('Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @ApiOperation({ summary: 'Onboard a new school' })
  @ApiResponse({ status: 201, type: School })
  async createSchool(@Body() createSchoolDto: CreateSchoolDto): Promise<School> {
    return this.schoolService.createSchool(createSchoolDto);
  }

  @Post('districts')
  @ApiOperation({ summary: 'Create a district' })
  @ApiResponse({ status: 201, type: District })
  async createDistrict(@Body() createDistrictDto: CreateDistrictDto): Promise<District> {
    return this.schoolService.createDistrict(createDistrictDto);
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts in a state' })
  @ApiResponse({ status: 200, type: [District] })
  async getDistrictsByState(@Query('state') state: string): Promise<District[]> {
    if (!state) {
      throw new BadRequestException('state query parameter is required');
    }
    return this.schoolService.getDistrictsByState(state);
  }

  @Get('districts/:id')
  @ApiOperation({ summary: 'Get a district by id' })
  @ApiResponse({ status: 200, type: District })
  async getDistrict(@Param('id') id: string): Promise<District> {
    const district = await this.schoolService.getDistrict(id);
    if (!district) {
      throw new NotFoundException(`District ${id} not found`);
    }
    return district;
  }

  @Get()
  @ApiOperation({ summary: 'List schools, filtered by organization or district' })
  @ApiResponse({ status: 200, type: [School] })
  async listSchools(
    @Query('organizationId') organizationId?: string,
    @Query('districtId') districtId?: string,
  ): Promise<School[]> {
    if (organizationId) {
      return this.schoolService.getSchoolsByOrganization(organizationId);
    }
    if (districtId) {
      return this.schoolService.getSchoolsByDistrict(districtId);
    }
    throw new BadRequestException('organizationId or districtId query parameter is required');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a school by id' })
  @ApiResponse({ status: 200, type: School })
  async getSchool(@Param('id') id: string): Promise<School> {
    const school = await this.schoolService.getSchool(id);
    if (!school) {
      throw new NotFoundException(`School ${id} not found`);
    }
    return school;
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get quick student/staff/assessment counts for a school' })
  @ApiResponse({ status: 200 })
  async getSchoolMetrics(@Param('id') id: string) {
    const metrics = await this.schoolService.getSchoolMetrics(id);
    if (!metrics) {
      throw new NotFoundException(`School ${id} not found`);
    }
    return metrics;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a school' })
  @ApiResponse({ status: 200, type: School })
  async updateSchool(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await this.schoolService.updateSchool(id, updateSchoolDto);
    if (!school) {
      throw new NotFoundException(`School ${id} not found`);
    }
    return school;
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a school' })
  @ApiResponse({ status: 200 })
  async deactivateSchool(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.schoolService.deactivateSchool(id);
    return { success: true };
  }
}
