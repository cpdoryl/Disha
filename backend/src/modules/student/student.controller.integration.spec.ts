import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { StudentController } from './student.controller';
import { StudentService } from '../../services/student.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  Student,
  StudentAttendance,
  StudentAcademicAssessment,
  CounsellorReferral,
  ReferralSeverity,
} from '../../database/entities';
import { Gender, AgeGroup } from '../../database/entities/Student.entity';
import { AttendanceStatus } from '../../database/entities/studentattendance.entity';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('StudentController (integration)', () => {
  let app: INestApplication;
  let studentRepo: MockRepo<Student>;
  let attendanceRepo: MockRepo<StudentAttendance>;
  let academicRepo: MockRepo<StudentAcademicAssessment>;
  let counsellorRepo: MockRepo<CounsellorReferral>;

  const schoolId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    studentRepo = createMockRepo<Student>();
    attendanceRepo = createMockRepo<StudentAttendance>();
    academicRepo = createMockRepo<StudentAcademicAssessment>();
    counsellorRepo = createMockRepo<CounsellorReferral>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        StudentService,
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(StudentAttendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(StudentAcademicAssessment), useValue: academicRepo },
        { provide: getRepositoryToken(CounsellorReferral), useValue: counsellorRepo },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /students', () => {
    it('enrolls a student', async () => {
      (studentRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve({ id: 'student-1', ...entity }));

      const response = await request(app.getHttpServer())
        .post('/students')
        .send({
          schoolId,
          enrollmentNumber: 'EN001',
          firstName: 'Asha',
          lastName: 'Rao',
          gender: Gender.FEMALE,
          dateOfBirth: '2015-01-01',
          gradeLevel: 4,
          ageGroup: AgeGroup.AGE_9_12,
        })
        .expect(201);

      expect(response.body.id).toBe('student-1');
    });

    it('rejects an invalid gender value', async () => {
      await request(app.getHttpServer())
        .post('/students')
        .send({
          schoolId,
          enrollmentNumber: 'EN001',
          firstName: 'Asha',
          lastName: 'Rao',
          gender: 'not-a-gender',
          dateOfBirth: '2015-01-01',
          gradeLevel: 4,
          ageGroup: AgeGroup.AGE_9_12,
        })
        .expect(400);
    });
  });

  describe('GET /students/:id', () => {
    it('returns 404 when the student does not exist', async () => {
      (studentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get('/students/missing-id').expect(404);
    });
  });

  describe('GET /students', () => {
    it('requires a schoolId query parameter', async () => {
      await request(app.getHttpServer()).get('/students').expect(400);
    });

    it('lists active students for a school', async () => {
      (studentRepo.find as jest.Mock).mockResolvedValue([]);

      await request(app.getHttpServer()).get(`/students?schoolId=${schoolId}`).expect(200);
    });
  });

  describe('GET /students/risk-profile', () => {
    it('requires a schoolId query parameter', async () => {
      await request(app.getHttpServer()).get('/students/risk-profile').expect(400);
    });

    it('returns the aggregated risk profile', async () => {
      (counsellorRepo.find as jest.Mock).mockResolvedValue([]);
      (attendanceRepo.find as jest.Mock).mockResolvedValue([]);
      (academicRepo.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get(`/students/risk-profile?schoolId=${schoolId}`)
        .expect(200);

      expect(response.body).toEqual({
        highRiskStudents: 0,
        atRiskStudents: 0,
        lowAttendanceStudents: 0,
        academiclyStruggling: 0,
      });
    });
  });

  describe('POST /students/attendance', () => {
    it('records an attendance entry', async () => {
      (attendanceRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      await request(app.getHttpServer())
        .post('/students/attendance')
        .send({
          studentId: schoolId,
          schoolId,
          attendanceDate: '2026-03-15',
          status: AttendanceStatus.PRESENT,
        })
        .expect(201);
    });
  });

  describe('PATCH /students/:id/status', () => {
    it('returns 404 when the student does not exist', async () => {
      (studentRepo.update as jest.Mock).mockResolvedValue(undefined);
      (studentRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/students/missing-id/status')
        .send({ status: 'withdrawn', reason: 'Relocated' })
        .expect(404);
    });

    it('rejects an invalid status', async () => {
      await request(app.getHttpServer()).patch('/students/student-1/status').send({ status: 'bogus' }).expect(400);
    });
  });

  describe('POST /students/counsellor-referrals', () => {
    it('creates a referral', async () => {
      (counsellorRepo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      await request(app.getHttpServer())
        .post('/students/counsellor-referrals')
        .send({
          studentId: schoolId,
          schoolId,
          reasonCode: 'anxiety',
          severity: ReferralSeverity.HIGH,
          referredBy: 'teacher-1',
        })
        .expect(201);
    });
  });
});
