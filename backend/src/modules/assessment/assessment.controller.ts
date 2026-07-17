import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Logger,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AssessmentService } from './assessment.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { CreateAssessmentDto } from './dto/assessment-response.dto';
import { Assessment, AssessmentStatus } from '../../database/entities';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('api/v2/assessments')
export class AssessmentController {
  private readonly logger = new Logger(AssessmentController.name);

  constructor(private readonly assessmentService: AssessmentService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check for assessment service' })
  health() {
    return { status: 'Assessment API healthy', timestamp: new Date() };
  }

  /**
   * Create new assessment cycle
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Create new assessment cycle' })
  @ApiResponse({ status: 201, type: Assessment })
  async createAssessment(
    @Body() createAssessmentDto: CreateAssessmentDto,
  ): Promise<Assessment> {
    this.logger.log(`Creating assessment for school ${createAssessmentDto.schoolId}`);
    return this.assessmentService.createAssessment(createAssessmentDto);
  }

  /**
   * Get all assessment cycles for a school
   */
  @Get('school/:schoolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get assessment cycles for a school' })
  async getAssessmentsBySchool(@Param('schoolId') schoolId: string) {
    return this.assessmentService.getAssessmentsBySchool(schoolId);
  }

  /**
   * Get assessment details
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher', 'student')
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiOperation({ summary: 'Get assessment details with response summary' })
  @ApiResponse({ status: 200 })
  async getAssessment(@Param('id') assessmentId: string) {
    this.logger.log(`Fetching assessment ${assessmentId}`);
    return this.assessmentService.getAssessment(assessmentId);
  }

  /**
   * Get questions for an assessment
   */
  @Get(':assessmentId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher', 'student')
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiOperation({ summary: 'Get assessment questions by respondent type' })
  @ApiResponse({ status: 200 })
  async getQuestions(
    @Param('assessmentId') assessmentId: string,
    @Query('respondentType') respondentType: string,
  ) {
    this.logger.log(
      `Fetching questions for assessment ${assessmentId}, type: ${respondentType}`,
    );

    if (!respondentType) {
      throw new BadRequestException('respondentType query parameter is required');
    }

    const questions = await this.assessmentService.getQuestionsForAssessment(
      assessmentId,
      respondentType as any,
    );

    return {
      questions,
      totalQuestions: questions.length,
      estimatedTimeMinutes: this.estimateTime(questions.length),
      instructions:
        'Please answer all questions honestly. Your responses are completely anonymous.',
    };
  }

  /**
   * MAIN ENDPOINT: Submit assessment responses (public for respondents)
   */
  @Post(':assessmentId/submit')
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiOperation({
    summary: 'Submit assessment responses (main Capture endpoint)',
  })
  @ApiResponse({ status: 200, description: 'Responses received and validated' })
  async submitResponses(
    @Param('assessmentId') assessmentId: string,
    @Body() submitResponseDto: SubmitResponseDto,
  ) {
    this.logger.log(
      `Receiving ${submitResponseDto.responses.length} responses for assessment ${assessmentId}`,
    );

    // Validate assessmentId matches
    if (assessmentId !== submitResponseDto.assessmentId) {
      throw new BadRequestException(
        'Assessment ID in URL does not match request body',
      );
    }

    return this.assessmentService.submitResponses(submitResponseDto);
  }

  /**
   * Check if respondent already submitted (public endpoint)
   */
  @Get(':assessmentId/my-response')
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiOperation({ summary: 'Check if user already submitted response' })
  @ApiResponse({ status: 200 })
  async checkIfSubmitted(
    @Param('assessmentId') assessmentId: string,
    @Query('respondentId') respondentId: string,
  ) {
    if (!respondentId) {
      throw new BadRequestException('respondentId query parameter is required');
    }

    const submitted = await this.assessmentService.hasRespondentSubmitted(
      assessmentId,
      respondentId,
    );

    if (submitted) {
      return {
        submitted: true,
        submissionDate: new Date(),
        message: 'You have already submitted your response for this assessment',
      };
    }

    return {
      submitted: false,
      message: 'You have not yet submitted a response',
    };
  }

  /**
   * Get data quality report
   */
  @Get(':assessmentId/data-quality-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ryl_admin', 'school_admin', 'teacher')
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiOperation({ summary: 'Get data quality metrics for assessment' })
  @ApiResponse({ status: 200 })
  async getDataQualityReport(@Param('assessmentId') assessmentId: string) {
    this.logger.log(`Generating data quality report for assessment ${assessmentId}`);
    return this.assessmentService.getDataQualityReport(assessmentId);
  }

  /**
   * Update assessment status (activate, close, archive)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiOperation({ summary: 'Update assessment status' })
  @ApiResponse({ status: 200, type: Assessment })
  async updateStatus(
    @Param('id') assessmentId: string,
    @Body('status') newStatus: AssessmentStatus,
  ): Promise<Assessment> {
    this.logger.log(`Updating assessment ${assessmentId} status to ${newStatus}`);

    if (!Object.values(AssessmentStatus).includes(newStatus)) {
      throw new BadRequestException('Invalid assessment status');
    }

    return this.assessmentService.updateAssessmentStatus(assessmentId, newStatus);
  }

  /**
   * Helper: Estimate time to complete assessment
   */
  private estimateTime(questionCount: number): number {
    // Assume 30-45 seconds per question average
    return Math.ceil((questionCount * 40) / 60); // Result in minutes
  }
}
