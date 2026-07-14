import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GapPredictionService, PriorityGapResult } from './gap-prediction.service';
import { GapPrediction } from '../../database/entities';
import { GeneratePriorityGapsDto } from './dto/generate-priority-gaps.dto';

@ApiTags('Gap Predictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gap-predictions')
export class GapPredictionController {
  constructor(private readonly gapPredictionService: GapPredictionService) {}

  @Post('generate')
  @ApiOperation({ summary: "Generate the priority gap report for a school's selected challenges" })
  @ApiResponse({ status: 201, description: 'Top 1-3 ranked priority gaps' })
  async generatePriorityGaps(@Body() dto: GeneratePriorityGapsDto): Promise<PriorityGapResult[]> {
    return this.gapPredictionService.generatePriorityGaps(dto.schoolId, dto.academicYear, dto.selectedChallengeIds);
  }

  @Get()
  @ApiOperation({ summary: 'Get previously generated gap predictions for a school' })
  @ApiResponse({ status: 200, type: [GapPrediction] })
  async getSchoolGaps(
    @Query('schoolId') schoolId: string,
    @Query('academicYear') academicYear: string,
  ): Promise<GapPrediction[]> {
    if (!schoolId || !academicYear) {
      throw new BadRequestException('schoolId and academicYear query parameters are required');
    }
    return this.gapPredictionService.getSchoolGaps(schoolId, academicYear);
  }
}
