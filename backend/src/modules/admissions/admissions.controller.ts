import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdmissionsService } from '../../services/admissions.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Admission } from 'src/database/entities';

@ApiTags('Admissions')
@ApiBearerAuth()
@Controller('api/v2/admissions')
@UseGuards(JwtAuthGuard)
export class AdmissionsController {
  constructor(private admissionsService: AdmissionsService) {}

  @Get('school/:schoolId')
  @ApiOperation({ summary: 'List admissions pipeline entries for a school' })
  @ApiResponse({ status: 200, type: [Admission] })
  async getAdmissionsBySchool(
    @Param('schoolId') schoolId: string,
  ): Promise<Admission[]> {
    return this.admissionsService.getAdmissionsBySchool(schoolId);
  }
}
