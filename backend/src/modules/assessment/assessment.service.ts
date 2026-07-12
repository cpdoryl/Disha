import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, RespondentType, AssessmentStatus } from 'src/database/entities/assessment.entity';
import { Question } from 'src/database/entities/question.entity';
import { AssessmentResponse } from 'src/database/entities/assessment-response.entity';
import { Challenge } from 'src/database/entities/challenge.entity';

export interface AdaptiveAssessmentRequest {
  schoolId: string;
  challengeIds: string[];
  respondentType: RespondentType;
}

export interface CreateAssessmentResponse {
  assessmentId: string;
  questions: Question[];
  totalQuestions: number;
  estimatedDurationMinutes: number;
}

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(AssessmentResponse)
    private assessmentResponseRepository: Repository<AssessmentResponse>,
  ) {}

  async createAdaptiveAssessment(request: AdaptiveAssessmentRequest): Promise<CreateAssessmentResponse> {
    if (!request.challengeIds || request.challengeIds.length === 0) {
      throw new BadRequestException('At least one challenge must be selected');
    }

    // Get selected challenges with their questions
    const challenges = await this.challengeRepository
      .createQueryBuilder('challenge')
      .whereInIds(request.challengeIds)
      .leftJoinAndSelect('challenge.questions', 'questions')
      .getMany();

    if (challenges.length === 0) {
      throw new BadRequestException('Invalid challenge IDs provided');
    }

    // Collect unique questions from selected challenges
    const questionsMap = new Map<string, Question>();
    challenges.forEach((challenge) => {
      challenge.questions.forEach((question) => {
        if (!questionsMap.has(question.id)) {
          questionsMap.set(question.id, question);
        }
      });
    });

    const questions = Array.from(questionsMap.values()).sort((a, b) => a.orderInAssessment - b.orderInAssessment);

    // Create assessment
    const assessment = this.assessmentRepository.create({
      schoolId: request.schoolId,
      assessmentName: `Adaptive Assessment - ${new Date().toISOString()}`,
      respondentType: request.respondentType,
      status: AssessmentStatus.ACTIVE,
    });

    const savedAssessment = await this.assessmentRepository.save(assessment);

    // Calculate estimated duration (2-3 minutes per question)
    const estimatedDurationMinutes = Math.ceil(questions.length * 2.5);

    return {
      assessmentId: savedAssessment.id,
      questions,
      totalQuestions: questions.length,
      estimatedDurationMinutes,
    };
  }

  async submitAssessmentResponse(
    assessmentId: string,
    respondentId: string,
    respondentType: RespondentType,
    responses: Array<{
      questionId: string;
      answerNumeric?: number;
      answerText?: string;
      answerJson?: any;
      confidence?: number;
    }>,
  ): Promise<void> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new BadRequestException('Assessment not found');
    }

    // Save all responses
    const assessmentResponses = responses.map((response) =>
      this.assessmentResponseRepository.create({
        assessmentId,
        respondentId,
        respondentType,
        questionId: response.questionId,
        answerNumeric: response.answerNumeric,
        answerText: response.answerText,
        answerJson: response.answerJson,
        confidence: response.confidence || 1.0,
      }),
    );

    await this.assessmentResponseRepository.save(assessmentResponses);
  }

  async getAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]> {
    return this.assessmentResponseRepository.find({
      where: { assessmentId },
      relations: ['question'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAssessmentsBySchool(schoolId: string): Promise<Assessment[]> {
    return this.assessmentRepository.find({
      where: { schoolId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });
  }
}
