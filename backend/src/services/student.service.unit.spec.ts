import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import {
  Student,
  StudentStatus,
  StudentAttendance,
  StudentAcademicAssessment,
  CounsellorReferral,
  AgeGroup,
  AcademicStatus,
  ReferralSeverity,
  ResolutionStatus,
} from 'src/database/entities';
import { Gender } from 'src/database/entities/Student.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('StudentService', () => {
  let service: StudentService;
  let studentRepo: MockRepo<Student>;
  let attendanceRepo: MockRepo<StudentAttendance>;
  let academicRepo: MockRepo<StudentAcademicAssessment>;
  let counsellorRepo: MockRepo<CounsellorReferral>;

  beforeEach(async () => {
    studentRepo = createMockRepo<Student>();
    attendanceRepo = createMockRepo<StudentAttendance>();
    academicRepo = createMockRepo<StudentAcademicAssessment>();
    counsellorRepo = createMockRepo<CounsellorReferral>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(StudentAttendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(StudentAcademicAssessment), useValue: academicRepo },
        { provide: getRepositoryToken(CounsellorReferral), useValue: counsellorRepo },
      ],
    }).compile();

    service = module.get(StudentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createStudent', () => {
    it('defaults status to ACTIVE and stamps an enrollment date', async () => {
      (studentRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.createStudent({
        schoolId: 'school-1',
        enrollmentNumber: 'EN001',
        firstName: 'Asha',
        lastName: 'Rao',
        gender: Gender.FEMALE,
        dateOfBirth: new Date('2015-01-01'),
        gradeLevel: 4,
        ageGroup: AgeGroup.AGE_9_12,
      });

      expect(result.status).toBe(StudentStatus.ACTIVE);
      expect(result.enrollmentDate).toBeInstanceOf(Date);
      expect(studentRepo.save).toHaveBeenCalled();
    });
  });

  describe('getStudentsBySchool', () => {
    it('only returns active students for the school, ordered by name', async () => {
      (studentRepo.find as jest.Mock).mockResolvedValue([]);

      await service.getStudentsBySchool('school-1');

      expect(studentRepo.find).toHaveBeenCalledWith({
        where: { schoolId: 'school-1', status: StudentStatus.ACTIVE },
        order: { lastName: 'ASC', firstName: 'ASC' },
      });
    });
  });

  describe('updateStudentStatus', () => {
    it('stamps a withdrawal date and reason when leaving active status', async () => {
      (studentRepo.update as jest.Mock).mockResolvedValue(undefined);
      (studentRepo.findOne as jest.Mock).mockResolvedValue({ id: 'student-1' } as Student);

      await service.updateStudentStatus('student-1', StudentStatus.WITHDRAWN, 'Relocated');

      expect(studentRepo.update).toHaveBeenCalledWith(
        'student-1',
        expect.objectContaining({
          status: StudentStatus.WITHDRAWN,
          withdrawalReasonDetail: 'Relocated',
          withdrawalDate: expect.any(Date),
        }),
      );
    });

    it('does not stamp a withdrawal date when the student stays active', async () => {
      (studentRepo.update as jest.Mock).mockResolvedValue(undefined);
      (studentRepo.findOne as jest.Mock).mockResolvedValue({ id: 'student-1' } as Student);

      await service.updateStudentStatus('student-1', StudentStatus.ACTIVE);

      expect(studentRepo.update).toHaveBeenCalledWith('student-1', { status: StudentStatus.ACTIVE });
    });
  });

  describe('recordAttendance', () => {
    it('derives the monthYear bucket from the attendance date', async () => {
      (attendanceRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.recordAttendance({
        studentId: 'student-1',
        schoolId: 'school-1',
        attendanceDate: new Date('2026-03-15'),
        status: 'present',
      });

      expect(result.monthYear).toEqual(new Date(2026, 2, 1));
    });
  });

  describe('getAttendanceReport', () => {
    it('computes attendance percentage across present/absent/leave records', async () => {
      (attendanceRepo.find as jest.Mock).mockResolvedValue([
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'leave' },
      ]);

      const report = await service.getAttendanceReport('student-1', new Date('2026-01-01'), new Date('2026-01-31'));

      expect(report).toEqual({
        totalDays: 4,
        presentDays: 2,
        absentDays: 1,
        leaveDays: 1,
        attendancePercentage: 50,
      });
    });

    it('returns zero percentage when there are no records', async () => {
      (attendanceRepo.find as jest.Mock).mockResolvedValue([]);

      const report = await service.getAttendanceReport('student-1', new Date('2026-01-01'), new Date('2026-01-31'));

      expect(report.attendancePercentage).toBe(0);
    });
  });

  describe('recordAcademicAssessment', () => {
    it.each([
      [95, 100, AcademicStatus.EXCEEDS],
      [70, 100, AcademicStatus.MEETS],
      [50, 100, AcademicStatus.APPROACHING],
      [20, 100, AcademicStatus.BELOW],
    ])('classifies %d/%d as %s', async (scoreObtained, scoreMax, expectedStatus) => {
      (academicRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.recordAcademicAssessment({
        studentId: 'student-1',
        schoolId: 'school-1',
        assessmentDate: new Date(),
        subject: 'Math',
        topic: 'Fractions',
        scoreObtained,
        scoreMax,
        gradeLevelExpectation: 4,
      });

      expect(result.status).toBe(expectedStatus);
    });
  });

  describe('referToCounsellor', () => {
    it('opens the referral with an ongoing resolution status', async () => {
      (counsellorRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.referToCounsellor({
        studentId: 'student-1',
        schoolId: 'school-1',
        reasonCode: 'anxiety',
        severity: ReferralSeverity.HIGH,
        referredBy: 'teacher-1',
      });

      expect(result.resolutionStatus).toBe(ResolutionStatus.ONGOING);
      expect(result.referralDate).toBeInstanceOf(Date);
    });
  });
});
