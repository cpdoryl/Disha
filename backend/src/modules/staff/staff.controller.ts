import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { SchoolScopeGuard } from 'src/common/guards/school-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('api/v2/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Create staff member' })
  async createStaff(@Body() createStaffDto: any) {
    return this.staffService.createStaff(createStaffDto);
  }

  @Get(':id')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Staff ID' })
  @ApiOperation({ summary: 'Get staff member details' })
  async getStaff(@Param('id') staffId: string) {
    return this.staffService.getStaff(staffId);
  }

  @Get('school/:schoolId')
  @UseGuards(SchoolScopeGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get staff by school' })
  async getStaffBySchool(@Param('schoolId') schoolId: string) {
    return this.staffService.getStaffBySchool(schoolId);
  }
}
