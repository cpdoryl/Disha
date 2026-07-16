import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InfrastructureService } from 'src/services/infrastructure.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Infrastructure')
@ApiBearerAuth()
@Controller('api/v2/infrastructure')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InfrastructureController {
  constructor(private infrastructureService: InfrastructureService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Record a school infrastructure status snapshot' })
  async recordStatus(@Body() recordDto: any) {
    return this.infrastructureService.recordStatus(recordDto);
  }

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get infrastructure status history for a school' })
  async getBySchool(@Param('schoolId') schoolId: string) {
    return this.infrastructureService.getBySchool(schoolId);
  }

  @Get('school/:schoolId/latest')
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get the latest infrastructure status for a school' })
  async getLatestForSchool(@Param('schoolId') schoolId: string) {
    return this.infrastructureService.getLatestForSchool(schoolId);
  }
}
