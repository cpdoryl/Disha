import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  ParentStudentLink,
  GuardianRelationship,
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
    @InjectRepository(ParentStudentLink)
    private parentStudentLinkRepository: Repository<ParentStudentLink>,
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

  async updateStudentStatus(studentId: string, status: StudentStatus, reason?: string): Promise<Student | null> {
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
    const attendanceDate = new Date(recordAttendanceDto.attendanceDate);
    if (isNaN(attendanceDate.getTime())) {
      throw new BadRequestException('attendanceDate must be a valid date');
    }
    if (!recordAttendanceDto.status) {
      throw new BadRequestException('status is required');
    }

    const attendance = new StudentAttendance();
    attendance.studentId = recordAttendanceDto.studentId;
    attendance.schoolId = recordAttendanceDto.schoolId;
    attendance.attendanceDate = attendanceDate;
    attendance.status = recordAttendanceDto.status as any; // Cast to bypass type mismatch
    attendance.term = recordAttendanceDto.term || '';
    attendance.markedByStaffId = recordAttendanceDto.markedByStaffId || '';
    attendance.notes = recordAttendanceDto.notes || '';
    attendance.monthYear = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), 1);

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
    const presentDays = records.filter((r) => r.status === 'present').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const leaveDays = records.filter((r) => r.status === 'leave').length;

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

  async getAcademicPerformance(studentId: string, term?: string): Promise<StudentAcademicAssessment[]> {
    const query = this.academicRepository
      .createQueryBuilder('academic')
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

  /**
   * Resolves a logged-in "student" user to their own student record.
   */
  async getMyProfile(userId: string): Promise<Student | null> {
    return this.studentRepository.findOne({ where: { userId } });
  }

  private async requireOwnStudentId(userId: string): Promise<string> {
    const student = await this.getMyProfile(userId);
    if (!student) {
      throw new NotFoundException('No student record is linked to this account');
    }
    return student.id;
  }

  /** Self-scoped: resolves the student's own record server-side, never a client-supplied ID. */
  async getMyAttendanceReport(userId: string, startDate: Date, endDate: Date) {
    const studentId = await this.requireOwnStudentId(userId);
    return this.getAttendanceReport(studentId, startDate, endDate);
  }

  /** Self-scoped: resolves the student's own record server-side, never a client-supplied ID. */
  async getMyAcademicPerformance(userId: string, term?: string) {
    const studentId = await this.requireOwnStudentId(userId);
    return this.getAcademicPerformance(studentId, term);
  }

  /**
   * Resolves a logged-in "parent" user to the student record(s) linked to them.
   */
  async getMyChildren(parentUserId: string): Promise<Student[]> {
    const links = await this.parentStudentLinkRepository.find({
      where: { parentUserId },
      relations: ['student'],
    });
    return links.map((link) => link.student);
  }

  /**
   * Links a student's own login account to their student record (admin action).
   */
  async linkUserToStudent(studentId: string, userId: string): Promise<Student | null> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    const alreadyLinked = await this.studentRepository.findOne({ where: { userId } });
    if (alreadyLinked && alreadyLinked.id !== studentId) {
      throw new ConflictException('This user account is already linked to a different student');
    }

    await this.studentRepository.update(studentId, { userId });
    return this.getStudent(studentId);
  }

  /**
   * Links a parent's login account to a child's student record (admin action).
   */
  async linkParentToStudent(
    studentId: string,
    parentUserId: string,
    relationship?: GuardianRelationship,
  ): Promise<ParentStudentLink> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const existing = await this.parentStudentLinkRepository.findOne({ where: { studentId, parentUserId } });
    if (existing) {
      throw new ConflictException('This parent is already linked to this student');
    }

    const link = this.parentStudentLinkRepository.create({ studentId, parentUserId, relationship });
    return this.parentStudentLinkRepository.save(link);
  }

  async unlinkParentFromStudent(studentId: string, parentUserId: string): Promise<void> {
    await this.parentStudentLinkRepository.delete({ studentId, parentUserId });
  }
}
