import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { StaffService } from '../../services/staff.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Staff } from 'src/database/entities';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('api/v2/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get('school/:schoolId')
  @ApiOperation({ summary: 'List active staff for a school' })
  @ApiResponse({ status: 200, type: [Staff] })
  async getStaffBySchool(@Param('schoolId') schoolId: string): Promise<Staff[]> {
    return this.staffService.getStaffBySchool(schoolId);
  }
}
