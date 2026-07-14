import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportingService, ReportType } from './reporting.service';
import {
  School,
  Assessment,
  AssessmentResponse,
  Student,
  StudentAcademicAssessment,
  StudentAttendance,
} from 'src/database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('ReportingService', () => {
  let service: ReportingService;
  let schoolRepo: MockRepo<School>;
  let assessmentRepo: MockRepo<Assessment>;
  let responseRepo: MockRepo<AssessmentResponse>;
  let studentRepo: MockRepo<Student>;
  let academicRepo: MockRepo<StudentAcademicAssessment>;
  let attendanceRepo: MockRepo<StudentAttendance>;

  beforeEach(async () => {
    schoolRepo = createMockRepo<School>();
    assessmentRepo = createMockRepo<Assessment>();
    responseRepo = createMockRepo<AssessmentResponse>();
    studentRepo = createMockRepo<Student>();
    academicRepo = createMockRepo<StudentAcademicAssessment>();
    attendanceRepo = createMockRepo<StudentAttendance>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: getRepositoryToken(School), useValue: schoolRepo },
        { provide: getRepositoryToken(Assessment), useValue: assessmentRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: responseRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(StudentAcademicAssessment), useValue: academicRepo },
        { provide: getRepositoryToken(StudentAttendance), useValue: attendanceRepo },
      ],
    }).compile();

    service = module.get(ReportingService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('generateAssessmentSummaryReport', () => {
    it('throws NotFoundException when the assessment does not exist', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.generateAssessmentSummaryReport('missing')).rejects.toThrow(NotFoundException);
    });

    it('summarizes response counts by respondent type', async () => {
      (assessmentRepo.findOne as jest.Mock).mockResolvedValue({
        cycleName: 'Term1_2026',
        status: 'active',
        questions: [{ id: 'q1' }, { id: 'q2' }],
      });
      (responseRepo.find as jest.Mock).mockResolvedValue([
        { respondentId: 'r1', respondentType: 'parent' },
        { respondentId: 'r1', respondentType: 'parent' },
        { respondentId: 'r2', respondentType: 'teacher' },
      ]);

      const report = await service.generateAssessmentSummaryReport('assessment-1');

      expect(report.totalQuestions).toBe(2);
      expect(report.totalResponses).toBe(3);
      expect(report.uniqueRespondents).toBe(2);
      expect(report.responsesByRespondentType).toEqual({ parent: 2, teacher: 1 });
    });
  });

  describe('generateSchoolPerformanceReport', () => {
    it('throws NotFoundException when the school does not exist', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateSchoolPerformanceReport('missing', new Date('2026-01-01'), new Date('2026-01-31')),
      ).rejects.toThrow(NotFoundException);
    });

    it('reports student/assessment/response counts for the period', async () => {
      (schoolRepo.findOne as jest.Mock).mockResolvedValue({ name: 'Greenwood High' });
      (studentRepo.count as jest.Mock).mockResolvedValue(500);
      (assessmentRepo.count as jest.Mock).mockResolvedValue(2);
      (responseRepo.count as jest.Mock).mockResolvedValue(340);

      const report = await service.generateSchoolPerformanceReport(
        'school-1',
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );

      expect(report.schoolName).toBe('Greenwood High');
      expect(report.activeStudents).toBe(500);
      expect(report.assessmentsInPeriod).toBe(2);
      expect(report.responsesInPeriod).toBe(340);
    });
  });

  describe('generateStudentProgressReport', () => {
    it('throws NotFoundException when the student does not exist', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.generateStudentProgressReport('missing')).rejects.toThrow(NotFoundException);
    });

    it('combines attendance and academic history', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue({
        firstName: 'Asha',
        lastName: 'Rao',
        gradeLevel: 6,
        status: 'active',
      });
      (attendanceRepo.find as jest.Mock).mockResolvedValue([{ status: 'present' }, { status: 'absent' }]);
      (academicRepo.find as jest.Mock).mockResolvedValue([{ percentage: 80 }, { percentage: 60 }]);

      const report = await service.generateStudentProgressReport('student-1');

      expect(report.attendance).toEqual({ totalDays: 2, presentDays: 1, attendancePercentage: '50.0' });
      expect(report.academics).toEqual({ assessmentsTaken: 2, averagePercentage: '70.0' });
    });
  });

  describe('exportReportToCSV', () => {
    it('renders an array of records as a CSV with a header row', async () => {
      const csv = await service.exportReportToCSV(ReportType.SCHOOL_PERFORMANCE, [
        { name: 'Greenwood High', students: 500 },
        { name: 'Oakridge, Intl', students: 300 },
      ]);

      expect(csv).toBe('name,students\nGreenwood High,500\n"Oakridge, Intl",300');
    });

    it('renders a flat object as a key/value CSV', async () => {
      const csv = await service.exportReportToCSV(ReportType.SCHOOL_PERFORMANCE, { schoolId: 'school-1', total: 42 });

      expect(csv).toBe('key,value\nschoolId,school-1\ntotal,42');
    });

    it('returns an empty string for an empty array', async () => {
      const csv = await service.exportReportToCSV(ReportType.SCHOOL_PERFORMANCE, []);

      expect(csv).toBe('');
    });
  });

  describe('scheduleReport', () => {
    it('rejects a schedule with no recipients', async () => {
      await expect(service.scheduleReport(ReportType.SCHOOL_PERFORMANCE, 'school-1', 'weekly', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('computes the next run date from the frequency', async () => {
      const before = Date.now();
      const result = await service.scheduleReport(ReportType.SCHOOL_PERFORMANCE, 'school-1', 'daily', [
        'owner@example.com',
      ]);

      expect(result.success).toBe(true);
      expect(result.nextRunAt.getTime()).toBeGreaterThan(before);
    });
  });
});
