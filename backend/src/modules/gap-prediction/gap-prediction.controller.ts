import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GapPredictionService } from './gap-prediction.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Gap Predictions')
@ApiBearerAuth()
@Controller('api/v2/gap-predictions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GapPredictionController {
  constructor(private gapPredictionService: GapPredictionService) {}

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'academicYear', required: true })
  @ApiOperation({ summary: 'Get ranked priority gap predictions for a school' })
  async getSchoolGaps(@Param('schoolId') schoolId: string, @Query('academicYear') academicYear: string) {
    return this.gapPredictionService.getSchoolGaps(schoolId, academicYear);
  }
}
