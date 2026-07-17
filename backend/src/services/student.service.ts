import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
  Gender,
} from 'src/database/entities';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(StudentAttendance)
    private attendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(StudentAcademicAssessment)
    private academicRepository: Repository<StudentAcademicAssessment>,
    @InjectRepository(CounsellorReferral)
    private counsellorRepository: Repository<CounsellorReferral>,
  ) {}

  async createStudent(createStudentDto: {
    schoolId: string;
    enrollmentNumber: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: Date;
    gradeLevel: number;
    classSection?: string;
    ageGroup: AgeGroup;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  }): Promise<Student> {
    const student = new Student();
    student.schoolId = createStudentDto.schoolId;
    student.enrollmentNumber = createStudentDto.enrollmentNumber;
    student.firstName = createStudentDto.firstName;
    student.lastName = createStudentDto.lastName;
    student.gender = createStudentDto.gender;
    student.dateOfBirth = createStudentDto.dateOfBirth;
    student.gradeLevel = createStudentDto.gradeLevel;
    student.classSection = createStudentDto.classSection || '';
    student.ageGroup = createStudentDto.ageGroup;
    student.guardianName = createStudentDto.guardianName || '';
    student.guardianPhone = createStudentDto.guardianPhone || '';
    student.guardianEmail = createStudentDto.guardianEmail || '';
    student.status = StudentStatus.ACTIVE;
    student.enrollmentDate = new Date();

    return this.studentRepository.save(student);
  }

  async getStudent(studentId: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
  }

  async getStudentsBySchool(schoolId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { schoolId, status: StudentStatus.ACTIVE },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async getClassesBySchool(schoolId: string) {
    const students = await this.getStudentsBySchool(schoolId);
    const byClass = new Map<string, { gradeLevel: number; classSection: string; strength: number }>();

    for (const student of students) {
      const key = `${student.gradeLevel ?? 'NA'}-${student.classSection ?? 'NA'}`;
      const existing = byClass.get(key);
      if (existing) {
        existing.strength += 1;
      } else {
        byClass.set(key, {
          gradeLevel: student.gradeLevel,
          classSection: student.classSection,
          strength: 1,
        });
      }
    }

    return Array.from(byClass.entries()).map(([key, value]) => ({
      id: key,
      name: `Class ${value.gradeLevel ?? 'N/A'}`,
      section: value.classSection ?? 'N/A',
      strength: value.strength,
    }));
  }

  async updateStudentStatus(
    studentId: string,
    status: StudentStatus,
    reason?: string,
  ): Promise<Student | null> {
    const updateData: any = {
      status,
    };
    if (status !== StudentStatus.ACTIVE) {
      updateData.withdrawalDate = new Date();
      if (reason) {
        updateData.withdrawalReasonDetail = reason;
      }
    }
    await this.studentRepository.update(studentId, updateData);
    return this.getStudent(studentId);
  }

  async recordAttendance(recordAttendanceDto: {
    studentId: string;
    schoolId: string;
    attendanceDate: Date;
    status: 'present' | 'absent' | 'leave' | 'half_day';
    term?: string;
    markedByStaffId?: string;
    notes?: string;
  }): Promise<StudentAttendance> {
    const attendance = new StudentAttendance();
    attendance.studentId = recordAttendanceDto.studentId;
    attendance.schoolId = recordAttendanceDto.schoolId;
    attendance.attendanceDate = recordAttendanceDto.attendanceDate;
    attendance.status = recordAttendanceDto.status as any; // Cast to bypass type mismatch
    attendance.term = recordAttendanceDto.term || '';
    attendance.markedByStaffId = recordAttendanceDto.markedByStaffId || '';
    attendance.notes = recordAttendanceDto.notes || '';
    attendance.monthYear = new Date(
      recordAttendanceDto.attendanceDate.getFullYear(),
      recordAttendanceDto.attendanceDate.getMonth(),
      1,
    );

    return this.attendanceRepository.save(attendance);
  }

  async getAttendanceReport(
    studentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    attendancePercentage: number;
  }> {
    const records = await this.attendanceRepository.find({
      where: {
        studentId,
        attendanceDate: Between(startDate, endDate),
      },
    });

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;

    return {
      totalDays,
      presentDays,
      absentDays,
      leaveDays,
      attendancePercentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
    };
  }

  async recordAcademicAssessment(recordAcademicDto: {
    studentId: string;
    schoolId: string;
    assessmentDate: Date;
    subject: string;
    topic: string;
    scoreObtained: number;
    scoreMax: number;
    gradeLevelExpectation: number;
    term?: string;
    assessmentType?: 'quiz' | 'midterm' | 'final' | 'project';
    teacherNotes?: string;
  }): Promise<StudentAcademicAssessment> {
    const percentage = (recordAcademicDto.scoreObtained / recordAcademicDto.scoreMax) * 100;
    let status: AcademicStatus;

    if (percentage >= 80) status = AcademicStatus.EXCEEDS;
    else if (percentage >= 60) status = AcademicStatus.MEETS;
    else if (percentage >= 40) status = AcademicStatus.APPROACHING;
    else status = AcademicStatus.BELOW;

    const assessment = new StudentAcademicAssessment();
    assessment.studentId = recordAcademicDto.studentId;
    assessment.schoolId = recordAcademicDto.schoolId;
    assessment.assessmentDate = recordAcademicDto.assessmentDate;
    assessment.subject = recordAcademicDto.subject;
    assessment.topic = recordAcademicDto.topic;
    assessment.scoreObtained = recordAcademicDto.scoreObtained;
    assessment.scoreMax = recordAcademicDto.scoreMax;
    assessment.percentage = percentage;
    assessment.gradeLevelExpectation = recordAcademicDto.gradeLevelExpectation;
    assessment.status = status;
    assessment.term = recordAcademicDto.term || '';
    assessment.assessmentType = recordAcademicDto.assessmentType || '';
    assessment.teacherNotes = recordAcademicDto.teacherNotes || '';

    return this.academicRepository.save(assessment);
  }

  async getAcademicPerformance(
    studentId: string,
    term?: string,
  ): Promise<StudentAcademicAssessment[]> {
    const query = this.academicRepository.createQueryBuilder('academic')
      .where('academic.studentId = :studentId', { studentId });

    if (term) {
      query.andWhere('academic.term = :term', { term });
    }

    return query.orderBy('academic.assessmentDate', 'DESC').getMany();
  }

  async referToCounsellor(referralDto: {
    studentId: string;
    schoolId: string;
    reasonCode: string;
    severity: ReferralSeverity;
    referredBy: string;
    counsellingProvided?: boolean;
  }): Promise<CounsellorReferral> {
    const referral = new CounsellorReferral();
    referral.studentId = referralDto.studentId;
    referral.schoolId = referralDto.schoolId;
    referral.reasonCode = referralDto.reasonCode;
    referral.severity = referralDto.severity;
    referral.referredBy = referralDto.referredBy;
    referral.counsellingProvided = referralDto.counsellingProvided || false;
    referral.referralDate = new Date();
    referral.resolutionStatus = ResolutionStatus.ONGOING;

    return this.counsellorRepository.save(referral);
  }

  async getStudentRiskProfile(schoolId: string): Promise<{
    highRiskStudents: number;
    atRiskStudents: number;
    lowAttendanceStudents: number;
    academiclyStruggling: number;
  }> {
    // Simplified - full implementation would aggregate across multiple metrics
    return {
      highRiskStudents: 0,
      atRiskStudents: 0,
      lowAttendanceStudents: 0,
      academiclyStruggling: 0,
    };
  }
}
