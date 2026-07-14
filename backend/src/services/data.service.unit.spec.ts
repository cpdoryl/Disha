import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataService } from './data.service';
import {
  OperationalData,
  MonitoringScorecard,
  ScorecardMetric,
  AssessmentResponse,
  StudentAttendance,
  StudentAcademicAssessment,
  Student,
  Staff,
} from 'src/database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('DataService', () => {
  let service: DataService;
  let operationalRepo: MockRepo<OperationalData>;
  let scorecardRepo: MockRepo<MonitoringScorecard>;
  let responseRepo: MockRepo<AssessmentResponse>;
  let attendanceRepo: MockRepo<StudentAttendance>;
  let academicRepo: MockRepo<StudentAcademicAssessment>;
  let studentRepo: MockRepo<Student>;
  let staffRepo: MockRepo<Staff>;

  beforeEach(async () => {
    operationalRepo = createMockRepo<OperationalData>();
    scorecardRepo = createMockRepo<MonitoringScorecard>();
    responseRepo = createMockRepo<AssessmentResponse>();
    attendanceRepo = createMockRepo<StudentAttendance>();
    academicRepo = createMockRepo<StudentAcademicAssessment>();
    studentRepo = createMockRepo<Student>();
    staffRepo = createMockRepo<Staff>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataService,
        { provide: getRepositoryToken(OperationalData), useValue: operationalRepo },
        { provide: getRepositoryToken(MonitoringScorecard), useValue: scorecardRepo },
        { provide: getRepositoryToken(AssessmentResponse), useValue: responseRepo },
        { provide: getRepositoryToken(StudentAttendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(StudentAcademicAssessment), useValue: academicRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(Staff), useValue: staffRepo },
      ],
    }).compile();

    service = module.get(DataService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('recordOperationalData', () => {
    it('derives the monthYear bucket from the data date', async () => {
      (operationalRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (operationalRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.recordOperationalData({
        schoolId: 'school-1',
        dataType: 'fee_default' as any,
        dataDate: new Date('2026-03-15'),
        dataValue: { count: 3 },
      });

      expect(result.monthYear).toEqual(new Date(2026, 2, 1));
    });
  });

  describe('generateMonitoringScorecard', () => {
    it('computes variance percentage and status per metric', async () => {
      (scorecardRepo.create as jest.Mock).mockImplementation((entity) => entity);
      (scorecardRepo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

      const results = await service.generateMonitoringScorecard('school-1', new Date('2026-03-01'), [
        { metric: ScorecardMetric.STUDENT_RETENTION, targetValue: 100, achievedValue: 110 },
        { metric: ScorecardMetric.TEACHER_RETENTION, targetValue: 100, achievedValue: 92 },
        { metric: ScorecardMetric.ACADEMIC_PERFORMANCE, targetValue: 100, achievedValue: 60 },
      ]);

      expect(results[0]).toMatchObject({ variancePercentage: 10, status: 'on_track' });
      expect(results[1]).toMatchObject({ variancePercentage: -8, status: 'at_risk' });
      expect(results[2]).toMatchObject({ variancePercentage: -40, status: 'off_track' });
    });
  });

  describe('getStudentRetentionMetrics', () => {
    it('computes a retention rate from active vs. withdrawn students', async () => {
      (studentRepo.count as jest.Mock).mockResolvedValue(90);
      (studentRepo.find as jest.Mock).mockResolvedValue([
        { withdrawalReasonCode: 'fee' },
        { withdrawalReasonCode: 'fee' },
        { withdrawalReasonCode: 'relocation' },
      ]);

      const result = await service.getStudentRetentionMetrics('school-1', '2026');

      expect(result.activeStudents).toBe(90);
      expect(result.withdrawnInYear).toBe(3);
      expect(result.retentionRate).toBe('96.8');
      expect(result.withdrawalReasonBreakdown).toEqual({ fee: 2, relocation: 1 });
    });

    it('returns a zero rate when there are no students at all', async () => {
      (studentRepo.count as jest.Mock).mockResolvedValue(0);
      (studentRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStudentRetentionMetrics('school-1', '2026');

      expect(result.retentionRate).toBe('0.0');
    });
  });

  describe('getTeacherRetentionMetrics', () => {
    it('computes a retention rate from active vs. exited staff', async () => {
      (staffRepo.count as jest.Mock).mockResolvedValue(18);
      (staffRepo.find as jest.Mock).mockResolvedValue([{ exitReasonCode: 'pay' }, { exitReasonCode: undefined }]);

      const result = await service.getTeacherRetentionMetrics('school-1', '2026');

      expect(result.activeStaff).toBe(18);
      expect(result.exitedInYear).toBe(2);
      expect(result.exitReasonBreakdown).toEqual({ pay: 1, unknown: 1 });
    });
  });

  describe('getAssessmentResponseQualityMetrics', () => {
    it('computes completeness and device breakdown', async () => {
      (responseRepo.find as jest.Mock).mockResolvedValue([
        { isValid: true, submissionTimeSeconds: 30, deviceType: 'web' },
        { isValid: true, submissionTimeSeconds: 50, deviceType: 'mobile_android' },
        { isValid: false, submissionTimeSeconds: null, deviceType: 'web' },
      ]);

      const result = await service.getAssessmentResponseQualityMetrics('assessment-1');

      expect(result.totalResponses).toBe(3);
      expect(result.validResponses).toBe(2);
      expect(result.completenessRate).toBe('66.7');
      expect(result.averageSubmissionTimeSeconds).toBe(40);
      expect(result.byDeviceType).toEqual({ web: 2, mobile_android: 1 });
    });
  });

  describe('getAcademicPerformanceDistribution', () => {
    it('averages percentage per subject and overall', async () => {
      (academicRepo.find as jest.Mock).mockResolvedValue([
        { subject: 'Math', percentage: 80, status: 'meets' },
        { subject: 'Math', percentage: 60, status: 'approaching' },
        { subject: 'English', percentage: 90, status: 'exceeds' },
      ]);

      const result = await service.getAcademicPerformanceDistribution('school-1');

      expect(result.totalAssessments).toBe(3);
      expect(result.bySubject).toEqual({ Math: '70.0', English: '90.0' });
      expect(result.byStatus).toEqual({ meets: 1, approaching: 1, exceeds: 1 });
      expect(result.averagePercentage).toBe('76.7');
    });
  });

  describe('getAttendanceTrendAnalysis', () => {
    it('buckets attendance records by month', async () => {
      (attendanceRepo.find as jest.Mock).mockResolvedValue([
        { attendanceDate: new Date('2026-01-10'), status: 'present' },
        { attendanceDate: new Date('2026-01-11'), status: 'absent' },
        { attendanceDate: new Date('2026-02-05'), status: 'present' },
      ]);

      const result = await service.getAttendanceTrendAnalysis('school-1', 3);

      expect(result).toEqual([
        { month: '2026-01', totalDays: 2, presentDays: 1, attendancePercentage: '50.0' },
        { month: '2026-02', totalDays: 1, presentDays: 1, attendancePercentage: '100.0' },
      ]);
    });
  });
});
