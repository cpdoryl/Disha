'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { schoolService } from '@/services/school.service';
import { studentService } from '@/services/student.service';
import { dataService } from '@/services/data.service';
import { auditService } from '@/services/audit.service';
import { staffService } from '@/services/staff.service';
import { admissionsService } from '@/services/admissions.service';
import { feeService } from '@/services/fee.service';
import { complianceService } from '@/services/compliance.service';
import { isoDaysAgo, isoNow } from '@/lib/dates';

export default function SchoolAdminDashboardPage() {
  const { schoolId } = useAuth();
  const hasSchool = Boolean(schoolId);

  const metrics = useAsync(() => schoolService.getMetrics(schoolId!), [schoolId], hasSchool);
  const riskProfile = useAsync(
    () => studentService.getRiskProfileBySchool(schoolId!),
    [schoolId],
    hasSchool,
  );
  const students = useAsync(() => studentService.listBySchool(schoolId!), [schoolId], hasSchool);
  const attendanceTrend = useAsync(
    () => dataService.getAttendanceTrendBySchool(schoolId!, 6),
    [schoolId],
    hasSchool,
  );
  const failedActions = useAsync(
    () => auditService.getFailedActions(schoolId!, isoDaysAgo(30), isoNow()),
    [schoolId],
    hasSchool,
  );
  const staffRetention = useAsync(
    () => staffService.getRetentionSummary(schoolId!),
    [schoolId],
    hasSchool,
  );
  const admissionsFunnel = useAsync(
    () => admissionsService.getFunnelSummary(schoolId!),
    [schoolId],
    hasSchool,
  );
  const feeSummary = useAsync(() => feeService.getCollectionSummary(schoolId!), [schoolId], hasSchool);
  const complaintSummary = useAsync(
    () => complianceService.getComplaintSummary(schoolId!),
    [schoolId],
    hasSchool,
  );

  return (
    <DashboardShell title="School Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Enrolled Students"
            value={metrics.data?.studentCount ?? '—'}
            hint="Active enrollment"
            isLoading={metrics.isLoading}
          />
          <StatCard
            label="Staff Members"
            value={metrics.data?.staffCount ?? '—'}
            hint="Teaching & non-teaching"
            isLoading={metrics.isLoading}
          />
          <StatCard
            label="At-Risk Students"
            value={riskProfile.data?.atRiskStudents ?? '—'}
            hint="Flagged by risk model"
            isLoading={riskProfile.isLoading}
          />
          <StatCard
            label="Failed Actions (30d)"
            value={failedActions.data?.length ?? '—'}
            hint="Security & audit log"
            isLoading={failedActions.isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Staff Retention"
            value={staffRetention.data ? `${staffRetention.data.retentionRate}%` : '—'}
            hint={staffRetention.data ? `${staffRetention.data.activeStaff} active of ${staffRetention.data.totalStaff}` : undefined}
            isLoading={staffRetention.isLoading}
          />
          <StatCard
            label="Fee Collection Rate"
            value={feeSummary.data ? `${feeSummary.data.collectionRate}%` : '—'}
            hint={feeSummary.data ? `${feeSummary.data.overdueCount} overdue entries` : undefined}
            isLoading={feeSummary.isLoading}
          />
          <StatCard
            label="Open Admission Inquiries"
            value={admissionsFunnel.data?.inquiry ?? '—'}
            hint={admissionsFunnel.data ? `${admissionsFunnel.data.admitted} admitted this cycle` : undefined}
            isLoading={admissionsFunnel.isLoading}
          />
          <StatCard
            label="Open Complaints"
            value={complaintSummary.data ? complaintSummary.data.pending + complaintSummary.data.inProgress : '—'}
            hint={complaintSummary.data ? `${complaintSummary.data.highSeverity} high severity` : undefined}
            isLoading={complaintSummary.isLoading}
          />
        </div>

        <TrendChart
          title="Attendance Trend (last 6 months)"
          data={attendanceTrend.data ?? []}
          xKey="month"
          yKey="attendanceRate"
        />

        {students.error ? (
          <EmptyState title="Could not load students" description={students.error.message} />
        ) : (
          <StudentTable students={students.data ?? []} title="Students" />
        )}
      </div>
    </DashboardShell>
  );
}
