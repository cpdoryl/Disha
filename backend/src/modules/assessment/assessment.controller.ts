import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AssessmentService, AdaptiveAssessmentRequest, CreateAssessmentResponse } from './assessment.service';
import { AssessmentResponse } from 'src/database/entities/assessment-response.entity';

@Controller('assessments')
@ApiTags('Assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('create-adaptive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create adaptive assessment based on selected challenges' })
  @ApiResponse({ status: 201, description: 'Adaptive assessment created with filtered questions' })
  async createAdaptiveAssessment(@Body() request: AdaptiveAssessmentRequest): Promise<CreateAssessmentResponse> {
    return this.assessmentService.createAdaptiveAssessment(request);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit assessment responses' })
  @ApiResponse({ status: 201, description: 'Assessment responses saved' })
  async submitAssessment(
    @Body()
    body: {
      assessmentId: string;
      respondentId: string;
      respondentType: string;
      responses: Array<{
        questionId: string;
        answerNumeric?: number;
        answerText?: string;
        confidence?: number;
      }>;
    },
  ): Promise<{ message: string }> {
    await this.assessmentService.submitAssessmentResponse(
      body.assessmentId,
      body.respondentId,
      body.respondentType as any,
      body.responses,
    );

    return { message: 'Assessment responses submitted successfully' };
  }

  @Get(':assessmentId/responses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessment responses' })
  @ApiResponse({ status: 200, description: 'Assessment responses', type: [AssessmentResponse] })
  async getAssessmentResponses(@Param('assessmentId') assessmentId: string): Promise<AssessmentResponse[]> {
    return this.assessmentService.getAssessmentResponses(assessmentId);
  }

  @Get('school/:schoolId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessments for a school' })
  async getSchoolAssessments(@Param('schoolId') schoolId: string) {
    return this.assessmentService.getAssessmentsBySchool(schoolId);
  }
}
