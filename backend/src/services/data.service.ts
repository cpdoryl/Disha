import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  OperationalData,
  MonitoringScorecard,
  ScorecardMetric,
  AssessmentResponse,
  StudentAttendance,
  StudentAcademicAssessment,
  Student,
  StudentStatus,
  Staff,
  EmploymentStatus,
} from 'src/database/entities';

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(OperationalData)
    private operationalRepository: Repository<OperationalData>,
    @InjectRepository(MonitoringScorecard)
    private scorecardRepository: Repository<MonitoringScorecard>,
    @InjectRepository(AssessmentResponse)
    private responseRepository: Repository<AssessmentResponse>,
    @InjectRepository(StudentAttendance)
    private attendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(StudentAcademicAssessment)
    private academicRepository: Repository<StudentAcademicAssessment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async recordOperationalData(recordDataDto: {
    schoolId: string;
    dataType: OperationalData['dataType'];
    dataDate: Date;
    dataValue: Record<string, any>;
    quantity?: number;
    notes?: string;
    source?: string;
  }): Promise<OperationalData> {
    const dataDate = new Date(recordDataDto.dataDate);
    const record = this.operationalRepository.create({
      ...recordDataDto,
      monthYear: new Date(dataDate.getFullYear(), dataDate.getMonth(), 1),
    });
    return this.operationalRepository.save(record);
  }

  async getOperationalDataForSchool(schoolId: string, startDate: Date, endDate: Date): Promise<OperationalData[]> {
    return this.operationalRepository.find({
      where: { schoolId, dataDate: Between(startDate, endDate) },
      order: { dataDate: 'DESC' },
    });
  }

  async generateMonitoringScorecard(
    schoolId: string,
    month: Date,
    metrics: Array<{
      metric: ScorecardMetric;
      targetValue: number;
      achievedValue: number;
      subMetrics?: Record<string, number>;
      analysisNotes?: string;
    }>,
  ): Promise<MonitoringScorecard[]> {
    const scorecardMonth = new Date(month.getFullYear(), month.getMonth(), 1);

    const scorecards = metrics.map((entry) => {
      const variancePercentage =
        entry.targetValue !== 0 ? ((entry.achievedValue - entry.targetValue) / entry.targetValue) * 100 : 0;

      return this.scorecardRepository.create({
        schoolId,
        scorecardMonth,
        metric: entry.metric,
        targetValue: entry.targetValue,
        achievedValue: entry.achievedValue,
        variancePercentage,
        subMetrics: entry.subMetrics,
        analysisNotes: entry.analysisNotes,
        status: variancePercentage >= 0 ? 'on_track' : variancePercentage >= -10 ? 'at_risk' : 'off_track',
      });
    });

    return this.scorecardRepository.save(scorecards);
  }

  async getScorecardReport(schoolId: string, startMonth: Date, endMonth: Date): Promise<MonitoringScorecard[]> {
    return this.scorecardRepository.find({
      where: { schoolId, scorecardMonth: Between(startMonth, endMonth) },
      order: { scorecardMonth: 'ASC' },
    });
  }

  /**
   * Phase 1 has no historical headcount snapshot table, so retention is
   * approximated from currently-active students vs. those withdrawn within
   * the academic year (Jan 1 - Dec 31 of the given year).
   */
  async getStudentRetentionMetrics(
    schoolId: string,
    academicYear: string,
  ): Promise<{
    activeStudents: number;
    withdrawnInYear: number;
    retentionRate: string;
    withdrawalReasonBreakdown: Record<string, number>;
  }> {
    const yearStart = new Date(`${academicYear}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${academicYear}-12-31T23:59:59.999Z`);

    const [activeStudents, withdrawnStudents] = await Promise.all([
      this.studentRepository.count({ where: { schoolId, status: StudentStatus.ACTIVE } }),
      this.studentRepository.find({
        where: { schoolId, withdrawalDate: Between(yearStart, yearEnd) },
      }),
    ]);

    const withdrawalReasonBreakdown: Record<string, number> = {};
    withdrawnStudents.forEach((student) => {
      const reason = student.withdrawalReasonCode || 'unknown';
      withdrawalReasonBreakdown[reason] = (withdrawalReasonBreakdown[reason] || 0) + 1;
    });

    const denominator = activeStudents + withdrawnStudents.length;

    return {
      activeStudents,
      withdrawnInYear: withdrawnStudents.length,
      retentionRate: denominator > 0 ? ((activeStudents / denominator) * 100).toFixed(1) : '0.0',
      withdrawalReasonBreakdown,
    };
  }

  /**
   * Same approximation as student retention: no historical staff headcount
   * snapshot, so this compares currently-active staff vs. those who exited
   * within the academic year.
   */
  async getTeacherRetentionMetrics(
    schoolId: string,
    academicYear: string,
  ): Promise<{
    activeStaff: number;
    exitedInYear: number;
    retentionRate: string;
    exitReasonBreakdown: Record<string, number>;
  }> {
    const yearStart = new Date(`${academicYear}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${academicYear}-12-31T23:59:59.999Z`);

    const [activeStaff, exitedStaff] = await Promise.all([
      this.staffRepository.count({ where: { schoolId, employmentStatus: EmploymentStatus.ACTIVE } }),
      this.staffRepository.find({
        where: { schoolId, exitDate: Between(yearStart, yearEnd) },
      }),
    ]);

    const exitReasonBreakdown: Record<string, number> = {};
    exitedStaff.forEach((staff) => {
      const reason = staff.exitReasonCode || 'unknown';
      exitReasonBreakdown[reason] = (exitReasonBreakdown[reason] || 0) + 1;
    });

    const denominator = activeStaff + exitedStaff.length;

    return {
      activeStaff,
      exitedInYear: exitedStaff.length,
      retentionRate: denominator > 0 ? ((activeStaff / denominator) * 100).toFixed(1) : '0.0',
      exitReasonBreakdown,
    };
  }

  async getAssessmentResponseQualityMetrics(assessmentId: string): Promise<{
    totalResponses: number;
    validResponses: number;
    invalidResponses: number;
    completenessRate: string;
    averageSubmissionTimeSeconds: number | null;
    byDeviceType: Record<string, number>;
  }> {
    const responses = await this.responseRepository.find({ where: { assessmentId } });

    const totalResponses = responses.length;
    const validResponses = responses.filter((r) => r.isValid).length;

    const submissionTimes = responses
      .map((r) => r.submissionTimeSeconds)
      .filter((t): t is number => t !== null && t !== undefined);

    const byDeviceType: Record<string, number> = {};
    responses.forEach((r) => {
      const device = r.deviceType || 'unknown';
      byDeviceType[device] = (byDeviceType[device] || 0) + 1;
    });

    return {
      totalResponses,
      validResponses,
      invalidResponses: totalResponses - validResponses,
      completenessRate: totalResponses > 0 ? ((validResponses / totalResponses) * 100).toFixed(1) : '0.0',
      averageSubmissionTimeSeconds:
        submissionTimes.length > 0
          ? Math.round(submissionTimes.reduce((a, b) => a + b, 0) / submissionTimes.length)
          : null,
      byDeviceType,
    };
  }

  async getAcademicPerformanceDistribution(schoolId: string): Promise<{
    totalAssessments: number;
    averagePercentage: string;
    byStatus: Record<string, number>;
    bySubject: Record<string, string>;
  }> {
    const assessments = await this.academicRepository.find({ where: { schoolId } });

    const byStatus: Record<string, number> = {};
    const subjectTotals: Record<string, { sum: number; count: number }> = {};

    assessments.forEach((assessment) => {
      const status = assessment.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;

      if (!subjectTotals[assessment.subject]) {
        subjectTotals[assessment.subject] = { sum: 0, count: 0 };
      }
      subjectTotals[assessment.subject].sum += Number(assessment.percentage);
      subjectTotals[assessment.subject].count++;
    });

    const bySubject: Record<string, string> = {};
    Object.entries(subjectTotals).forEach(([subject, { sum, count }]) => {
      bySubject[subject] = (sum / count).toFixed(1);
    });

    const overallSum = assessments.reduce((sum, a) => sum + Number(a.percentage), 0);

    return {
      totalAssessments: assessments.length,
      averagePercentage: assessments.length > 0 ? (overallSum / assessments.length).toFixed(1) : '0.0',
      byStatus,
      bySubject,
    };
  }

  async getAttendanceTrendAnalysis(
    schoolId: string,
    months: number = 6,
  ): Promise<Array<{ month: string; totalDays: number; presentDays: number; attendancePercentage: string }>> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const records = await this.attendanceRepository.find({
      where: { schoolId, attendanceDate: Between(cutoff, new Date()) },
    });

    const byMonth: Record<string, { total: number; present: number }> = {};
    records.forEach((record) => {
      const date = new Date(record.attendanceDate);
      const bucket = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[bucket]) {
        byMonth[bucket] = { total: 0, present: 0 };
      }
      byMonth[bucket].total++;
      if (record.status === 'present') {
        byMonth[bucket].present++;
      }
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { total, present }]) => ({
        month,
        totalDays: total,
        presentDays: present,
        attendancePercentage: total > 0 ? ((present / total) * 100).toFixed(1) : '0.0',
      }));
  }
}
