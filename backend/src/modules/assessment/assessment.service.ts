import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Assessment,
  AssessmentResponse,
  Question,
  AssessmentStatus,
  RespondentType,
  QuestionType,
} from '../../database/entities';
import { CreateAssessmentDto, AssessmentResponseDto } from './dto/assessment-response.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(AssessmentResponse)
    private responseRepository: Repository<AssessmentResponse>,
  ) {}

  /**
   * Create a new assessment cycle
   */
  async createAssessment(
    createAssessmentDto: CreateAssessmentDto,
  ): Promise<Assessment> {
    try {
      const assessment = this.assessmentRepository.create({
        ...createAssessmentDto,
        status: AssessmentStatus.DRAFT,
      });

      const saved = await this.assessmentRepository.save(assessment);
      this.logger.log(
        `Assessment created: ${saved.id} for school ${saved.schoolId}`,
      );
      return saved;
    } catch (error: any) {
      this.logger.error(
        `Failed to create assessment: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new BadRequestException('Failed to create assessment');
    }
  }

  /**
   * Get all assessment cycles for a school
   */
  async getAssessmentsBySchool(schoolId: string): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get assessment by ID with response summary
   */
  async getAssessment(assessmentId: string): Promise<any> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
      relations: ['questions', 'school'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    // Get response statistics
    const responses = await this.responseRepository.find({
      where: { assessmentId },
    });

    const groupedByRespondentType: Record<string, any[]> = {};
    responses.forEach((response) => {
      if (!groupedByRespondentType[response.respondentType]) {
        groupedByRespondentType[response.respondentType] = [];
      }
      groupedByRespondentType[response.respondentType].push(response);
    });

    const responseSummary: Record<string, any> = {};
    for (const [type, typeResponses] of Object.entries(
      groupedByRespondentType,
    )) {
      const uniqueRespondents = new Set(
        (typeResponses as any[]).map((r) => r.respondentId),
      );
      responseSummary[type] = {
        expected: 0, // Would be calculated from school data
        received: uniqueRespondents.size,
        rate: `${((uniqueRespondents.size / (0 || 1)) * 100).toFixed(1)}%`,
      };
    }

    return {
      assessment,
      responseSummary,
      totalQuestions: assessment.questions.length,
      totalResponses: responses.length,
    };
  }

  /**
   * Get all questions for an assessment by respondent type
   */
  async getQuestionsForAssessment(
    assessmentId: string,
    respondentType: RespondentType,
  ): Promise<Question[]> {
    const questions = await this.questionRepository.find({
      where: {
        assessmentId,
        respondentType,
      },
      order: {
        orderInForm: 'ASC',
      },
    });

    if (questions.length === 0) {
      this.logger.warn(
        `No questions found for assessment ${assessmentId} and type ${respondentType}`,
      );
    }

    return questions;
  }

  /**
   * Submit assessment responses (main Capture endpoint)
   */
  async submitResponses(
    submitResponseDto: SubmitResponseDto,
  ): Promise<AssessmentResponseDto> {
    const {
      assessmentId,
      schoolId,
      respondentId,
      respondentType,
      responses,
      metadata,
    } = submitResponseDto;

    this.logger.log(
      `Submitting ${responses.length} responses for assessment ${assessmentId}`,
    );

    // Validate assessment exists and is active
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    if (assessment.status !== AssessmentStatus.ACTIVE) {
      throw new BadRequestException(
        `Assessment is ${assessment.status}, not accepting responses`,
      );
    }

    // Process each response
    const savedResponses = [];
    const validationErrors = [];

    for (const response of responses) {
      try {
        // Validate question exists
        const question = await this.questionRepository.findOne({
          where: { id: response.questionId },
        });

        if (!question) {
          validationErrors.push({
            questionId: response.questionId,
            error: 'Question not found',
          });
          continue;
        }

        // Validate response value based on question type
        const validationResult = this.validateResponse(
          response.responseValue,
          question.questionType,
        );

        if (!validationResult.valid) {
          validationErrors.push({
            questionId: response.questionId,
            error: validationResult.error,
          });
          continue;
        }

        // Create and save response
        const assessmentResponse = this.responseRepository.create({
          assessmentId,
          schoolId,
          respondentId,
          respondentType,
          questionId: response.questionId,
          responseValue: response.responseValue,
          responseText: response.responseText,
          responseNumeric: validationResult.numeric,
          isValid: true,
          ipAddress: metadata?.ipAddress,
          deviceType: metadata?.deviceType,
          deviceOs: metadata?.deviceOs,
          submissionTimeSeconds: metadata?.submissionTimeSeconds,
          timezone: metadata?.timezone,
          submissionTimestamp: new Date(),
        });

        const saved = await this.responseRepository.save(assessmentResponse);
        savedResponses.push(saved);
      } catch (error: any) {
        this.logger.error(
          `Failed to save response: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
        validationErrors.push({
          questionId: response.questionId,
          error: error?.message || 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Saved ${savedResponses.length} responses, ${validationErrors.length} errors`,
    );

    return {
      submissionId: `${assessmentId}-${respondentId}-${Date.now()}`,
      status: 'received',
      timestamp: new Date(),
      responsesReceived: savedResponses.length,
      responsesRejected: validationErrors.length,
      validationErrors,
      receiptMessage:
        'Thank you! Your response has been recorded successfully.',
    };
  }

  /**
   * Validate individual response based on question type
   */
  private validateResponse(
    responseValue: string,
    questionType: QuestionType,
  ): { valid: boolean; error?: string; numeric?: number } {
    try {
      switch (questionType) {
        case QuestionType.LIKERT_5:
        case QuestionType.LIKERT_5_REVERSE:
          const likertValue = parseInt(responseValue, 10);
          if (isNaN(likertValue) || likertValue < 1 || likertValue > 5) {
            return {
              valid: false,
              error: 'Likert scale must be between 1 and 5',
            };
          }
          return { valid: true, numeric: likertValue };

        case QuestionType.RATING_NPS:
          const npsValue = parseInt(responseValue, 10);
          if (isNaN(npsValue) || npsValue < 0 || npsValue > 10) {
            return {
              valid: false,
              error: 'NPS must be between 0 and 10',
            };
          }
          return { valid: true, numeric: npsValue };

        case QuestionType.YES_NO:
          if (!['yes', 'no', 'true', 'false'].includes(responseValue.toLowerCase())) {
            return {
              valid: false,
              error: 'Yes/No response must be yes or no',
            };
          }
          return { valid: true };

        case QuestionType.MULTIPLE_CHOICE:
          if (!responseValue || responseValue.trim().length === 0) {
            return {
              valid: false,
              error: 'Multiple choice response cannot be empty',
            };
          }
          return { valid: true };

        case QuestionType.OPEN_TEXT:
          if (!responseValue || responseValue.trim().length === 0) {
            return {
              valid: false,
              error: 'Text response cannot be empty',
            };
          }
          return { valid: true };

        default:
          return { valid: false, error: 'Unknown question type' };
      }
    } catch (error: any) {
      return { valid: false, error: `Validation error: ${error?.message || 'Unknown error'}` };
    }
  }

  /**
   * Check if respondent already submitted for this assessment
   */
  async hasRespondentSubmitted(
    assessmentId: string,
    respondentId: string,
  ): Promise<boolean> {
    const response = await this.responseRepository.findOne({
      where: {
        assessmentId,
        respondentId,
      },
    });
    return !!response;
  }

  /**
   * Get data quality report
   */
  async getDataQualityReport(assessmentId: string): Promise<any> {
    const responses = await this.responseRepository.find({
      where: { assessmentId },
    });

    const totalResponses = responses.length;
    const validResponses = responses.filter((r) => r.isValid).length;
    const invalidResponses = totalResponses - validResponses;

    const groupedByType: Record<string, any> = {};
    responses.forEach((response) => {
      if (!groupedByType[response.respondentType]) {
        groupedByType[response.respondentType] = {
          total: 0,
          valid: 0,
          invalid: 0,
        };
      }
      groupedByType[response.respondentType].total++;
      if (response.isValid) {
        groupedByType[response.respondentType].valid++;
      } else {
        groupedByType[response.respondentType].invalid++;
      }
    });

    return {
      totalResponses,
      validResponses,
      invalidResponses,
      completenessRate: ((validResponses / totalResponses) * 100).toFixed(1),
      qualityScore: ((validResponses / totalResponses) * 100).toFixed(1),
      byRespondentType: groupedByType,
    };
  }

  /**
   * Update assessment status
   */
  async updateAssessmentStatus(
    assessmentId: string,
    newStatus: AssessmentStatus,
  ): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    assessment.status = newStatus;
    const updated = await this.assessmentRepository.save(assessment);

    this.logger.log(
      `Assessment ${assessmentId} status updated to ${newStatus}`,
    );
    return updated;
  }
}
