import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  School,
  Assessment,
  AssessmentResponse,
  Student,
  StudentAcademicAssessment,
  StudentAttendance,
} from 'src/database/entities';

export enum ReportType {
  ASSESSMENT_SUMMARY = 'assessment_summary',
  SCHOOL_PERFORMANCE = 'school_performance',
  STUDENT_PROGRESS = 'student_progress',
  STAFF_PERFORMANCE = 'staff_performance',
  OPERATIONAL_METRICS = 'operational_metrics',
  COMPLIANCE = 'compliance',
}

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentResponse)
    private responseRepository: Repository<AssessmentResponse>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(StudentAcademicAssessment)
    private academicRepository: Repository<StudentAcademicAssessment>,
    @InjectRepository(StudentAttendance)
    private attendanceRepository: Repository<StudentAttendance>,
  ) {}

  async generateAssessmentSummaryReport(assessmentId: string): Promise<{
    assessmentId: string;
    cycleName: string;
    status: string;
    totalQuestions: number;
    totalResponses: number;
    uniqueRespondents: number;
    responsesByRespondentType: Record<string, number>;
  }> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id: assessmentId },
      relations: ['questions'],
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    const responses = await this.responseRepository.find({ where: { assessmentId } });
    const uniqueRespondents = new Set(responses.map((r) => r.respondentId)).size;

    const responsesByRespondentType: Record<string, number> = {};
    responses.forEach((response) => {
      responsesByRespondentType[response.respondentType] =
        (responsesByRespondentType[response.respondentType] || 0) + 1;
    });

    return {
      assessmentId,
      cycleName: assessment.cycleName,
      status: assessment.status,
      totalQuestions: assessment.questions?.length ?? 0,
      totalResponses: responses.length,
      uniqueRespondents,
      responsesByRespondentType,
    };
  }

  async generateSchoolPerformanceReport(
    schoolId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    schoolId: string;
    schoolName: string;
    period: { startDate: Date; endDate: Date };
    activeStudents: number;
    assessmentsInPeriod: number;
    responsesInPeriod: number;
  }> {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School ${schoolId} not found`);
    }

    const [activeStudents, assessmentsInPeriod, responsesInPeriod] = await Promise.all([
      this.studentRepository.count({ where: { schoolId } }),
      this.assessmentRepository.count({
        where: { schoolId, createdAt: Between(startDate, endDate) },
      }),
      this.responseRepository.count({
        where: { schoolId, submissionTimestamp: Between(startDate, endDate) },
      }),
    ]);

    return {
      schoolId,
      schoolName: school.name,
      period: { startDate, endDate },
      activeStudents,
      assessmentsInPeriod,
      responsesInPeriod,
    };
  }

  async generateStudentProgressReport(studentId: string): Promise<{
    studentId: string;
    firstName: string;
    lastName: string;
    gradeLevel: number;
    status: string;
    attendance: { totalDays: number; presentDays: number; attendancePercentage: string };
    academics: { assessmentsTaken: number; averagePercentage: string };
  }> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const [attendanceRecords, academicRecords] = await Promise.all([
      this.attendanceRepository.find({ where: { studentId } }),
      this.academicRepository.find({ where: { studentId } }),
    ]);

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r) => r.status === 'present').length;

    const averagePercentage =
      academicRecords.length > 0
        ? academicRecords.reduce((sum, a) => sum + Number(a.percentage), 0) / academicRecords.length
        : 0;

    return {
      studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      gradeLevel: student.gradeLevel,
      status: student.status,
      attendance: {
        totalDays,
        presentDays,
        attendancePercentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0',
      },
      academics: {
        assessmentsTaken: academicRecords.length,
        averagePercentage: averagePercentage.toFixed(1),
      },
    };
  }

  /**
   * Simple CSV serializer for report payloads. Accepts either an array of
   * flat records (one row per record) or a single flat object (rendered as
   * a two-column key/value table).
   */
  async exportReportToCSV(reportType: ReportType, data: Record<string, any> | Record<string, any>[]): Promise<string> {
    const escapeCell = (value: any): string => {
      const cell = value === null || value === undefined ? '' : String(value);
      return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
    };

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '';
      }
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((header) => escapeCell(row[header])).join(','));
      return [headers.join(','), ...rows].join('\n');
    }

    const rows = Object.entries(data).map(([key, value]) => `${escapeCell(key)},${escapeCell(value)}`);
    return ['key,value', ...rows].join('\n');
  }

  async scheduleReport(
    reportType: ReportType,
    schoolId: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: string[],
  ): Promise<{ success: boolean; reportId: string; reportType: ReportType; schoolId: string; nextRunAt: Date }> {
    if (!recipients || recipients.length === 0) {
      throw new BadRequestException('At least one recipient is required to schedule a report');
    }

    const nextRunAt = new Date();
    const daysUntilNextRun = { daily: 1, weekly: 7, monthly: 30, quarterly: 90 }[frequency];
    nextRunAt.setDate(nextRunAt.getDate() + daysUntilNextRun);

    // Phase 1 has no job queue or ScheduledReport table yet, so this
    // computes the next run time but does not persist or dispatch anything.
    return {
      success: true,
      reportId: `report-${schoolId}-${Date.now()}`,
      reportType,
      schoolId,
      nextRunAt,
    };
  }
}
