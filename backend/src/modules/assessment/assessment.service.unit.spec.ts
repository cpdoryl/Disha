import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssessmentService } from './assessment.service';
import {
  Assessment,
  AssessmentResponse,
  Question,
  AssessmentStatus,
  QuestionType,
  RespondentType,
} from '../../database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let assessmentRepo: MockRepo<Assessment>;
  let questionRepo: MockRepo<Question>;
  let responseRepo: MockRepo<AssessmentResponse>;

  beforeEach(async () => {
    assessmentRepo = createMockRepo<Assessment>();
    questionRepo = createMockRepo<Question>();
    responseRepo = createMockRepo<AssessmentResponse>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepo },
        { provide: getRepositoryToken(Question), useValue: questionRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: responseRepo },
      ],
    }).compile();

    service = module.get(AssessmentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createAssessment', () => {
    it('creates the assessment in draft status', async () => {
      (assessmentRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (assessmentRepo.save as jest.Mock).mockImplementation((entity) =>
        Promise.resolve({ id: 'assessment-1', ...entity }),
      );

      const result = await service.createAssessment({ schoolId: 'school-1', cycleName: 'Term1_2026' });

      expect(result.status).toBe(AssessmentStatus.DRAFT);
      expect(result.id).toBe('assessment-1');
    });

    it('wraps repository failures in a BadRequestException', async () => {
      (assessmentRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (assessmentRepo.save as jest.Mock).mockRejectedValue(new Error('db down'));

      await expect(service.createAssessment({ schoolId: 'school-1', cycleName: 'Term1_2026' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAssessment', () => {
    it('throws NotFoundException when the assessment does not exist', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getAssessment('missing')).rejects.toThrow(NotFoundException);
    });

    it('summarizes responses per respondent type', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'assessment-1',
        questions: [{ id: 'q1' }, { id: 'q2' }],
      });
      (responseRepo.find as jest.Mock).mockResolvedValue([
        { respondentId: 'r1', respondentType: RespondentType.PARENT },
        { respondentId: 'r2', respondentType: RespondentType.PARENT },
        { respondentId: 'r3', respondentType: RespondentType.TEACHER },
      ]);

      const result = await service.getAssessment('assessment-1');

      expect(result.totalQuestions).toBe(2);
      expect(result.totalResponses).toBe(3);
      expect(result.responseSummary[RespondentType.PARENT].received).toBe(2);
      expect(result.responseSummary[RespondentType.TEACHER].received).toBe(1);
    });
  });

  describe('getQuestionsForAssessment', () => {
    it('orders questions by form position', async () => {
      (questionRepo.find as jest.Mock).mockResolvedValue([]);

      await service.getQuestionsForAssessment('assessment-1', RespondentType.TEACHER);

      expect(questionRepo.find).toHaveBeenCalledWith({
        where: { assessmentId: 'assessment-1', respondentType: RespondentType.TEACHER },
        order: { orderInForm: 'ASC' },
      });
    });
  });

  describe('submitResponses', () => {
    const baseDto = {
      assessmentId: 'assessment-1',
      schoolId: 'school-1',
      respondentId: 'respondent-1',
      respondentType: RespondentType.PARENT,
      responses: [{ questionId: 'q1', responseValue: '4' }],
    };

    it('rejects submissions for an assessment that is not active', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue({ status: AssessmentStatus.DRAFT });

      await expect(service.submitResponses(baseDto as any)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the assessment does not exist', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.submitResponses(baseDto as any)).rejects.toThrow(NotFoundException);
    });

    it('saves valid likert responses and reports zero rejections', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue({ status: AssessmentStatus.ACTIVE });
      (questionRepo.findOne as jest.Mock).mockResolvedValue({ questionType: QuestionType.LIKERT_5 });
      (responseRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (responseRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.submitResponses(baseDto as any);

      expect(result.responsesReceived).toBe(1);
      expect(result.responsesRejected).toBe(0);
      expect(result.status).toBe('received');
    });

    it('rejects an out-of-range likert value without saving it', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue({ status: AssessmentStatus.ACTIVE });
      (questionRepo.findOne as jest.Mock).mockResolvedValue({ questionType: QuestionType.LIKERT_5 });

      const result = await service.submitResponses({
        ...baseDto,
        responses: [{ questionId: 'q1', responseValue: '9' }],
      } as any);

      expect(result.responsesReceived).toBe(0);
      expect(result.responsesRejected).toBe(1);
      expect(responseRepo.save).not.toHaveBeenCalled();
    });

    it('records a validation error when the question does not exist', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue({ status: AssessmentStatus.ACTIVE });
      (questionRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.submitResponses(baseDto as any);

      expect(result.responsesRejected).toBe(1);
      expect(result.validationErrors[0].error).toBe('Question not found');
    });
  });

  describe('hasRespondentSubmitted', () => {
    it('returns true when a matching response exists', async () => {
      (responseRepo.findOne as jest.Mock).mockResolvedValue({ id: 'response-1' });

      await expect(service.hasRespondentSubmitted('assessment-1', 'respondent-1')).resolves.toBe(true);
    });

    it('returns false when no matching response exists', async () => {
      (responseRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.hasRespondentSubmitted('assessment-1', 'respondent-1')).resolves.toBe(false);
    });
  });

  describe('getDataQualityReport', () => {
    it('computes completeness and quality scores from valid/invalid responses', async () => {
      (responseRepo.find as jest.Mock).mockResolvedValue([
        { isValid: true, respondentType: RespondentType.PARENT },
        { isValid: true, respondentType: RespondentType.PARENT },
        { isValid: false, respondentType: RespondentType.TEACHER },
      ]);

      const report = await service.getDataQualityReport('assessment-1');

      expect(report.totalResponses).toBe(3);
      expect(report.validResponses).toBe(2);
      expect(report.invalidResponses).toBe(1);
      expect(report.completenessRate).toBe('66.7');
      expect(report.byRespondentType[RespondentType.TEACHER]).toEqual({ total: 1, valid: 0, invalid: 1 });
    });
  });

  describe('updateAssessmentStatus', () => {
    it('throws NotFoundException when the assessment does not exist', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateAssessmentStatus('missing', AssessmentStatus.ACTIVE)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates and persists the new status', async () => {
      const assessment = { id: 'assessment-1', status: AssessmentStatus.DRAFT };
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue(assessment);
      (assessmentRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateAssessmentStatus('assessment-1', AssessmentStatus.ACTIVE);

      expect(result.status).toBe(AssessmentStatus.ACTIVE);
    });
  });
});
