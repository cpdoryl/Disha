'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useAsync } from '@/hooks/useAsync';
import { studentService } from '@/services/student.service';
import { isoDaysAgo, isoNow } from '@/lib/dates';
import type { AcademicAssessment } from '@/types/student';

const assessmentColumns: DataTableColumn<AcademicAssessment>[] = [
  {
    key: 'assessmentDate',
    header: 'Date',
    sortable: true,
    sortValue: (a) => a.assessmentDate,
    render: (a) => new Date(a.assessmentDate).toLocaleDateString(),
  },
  { key: 'subject', header: 'Subject', render: (a) => a.subject },
  { key: 'topic', header: 'Topic', render: (a) => a.topic },
  {
    key: 'score',
    header: 'Score',
    sortable: true,
    sortValue: (a) => a.percentage,
    render: (a) => `${a.scoreObtained}/${a.scoreMax} (${Math.round(a.percentage)}%)`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (a) => (
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        {a.status}
      </span>
    ),
  },
];

export default function StudentDashboardPage() {
  const profile = useAsync(() => studentService.getMyProfile(), []);
  const studentId = profile.data?.id;
  const hasProfile = Boolean(studentId);

  const attendance = useAsync(
    () => studentService.getMyAttendanceReport(isoDaysAgo(90), isoNow()),
    [studentId],
    hasProfile,
  );
  const academicPerformance = useAsync(
    () => studentService.getMyAcademicPerformance(),
    [studentId],
    hasProfile,
  );

  if (profile.error) {
    return (
      <DashboardShell title="Student Dashboard">
        <EmptyState
          title="Could not load your student profile"
          description="Your account may not be linked to a student record yet — contact your school admin to have it linked."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Student Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Grade / Section"
            value={
              profile.data
                ? `${profile.data.gradeLevel ?? '—'}${profile.data.classSection ? `-${profile.data.classSection}` : ''}`
                : '—'
            }
            isLoading={profile.isLoading}
          />
          <StatCard
            label="Attendance (last 90 days)"
            value={attendance.data ? `${Math.round(attendance.data.attendancePercentage)}%` : '—'}
            hint={attendance.data ? `${attendance.data.presentDays} of ${attendance.data.totalDays} days` : undefined}
            isLoading={attendance.isLoading}
          />
          <StatCard
            label="Assessments Recorded"
            value={academicPerformance.data?.length ?? '—'}
            isLoading={academicPerformance.isLoading}
          />
          <StatCard label="Announcements" value="—" hint="Backend endpoint not yet available" />
        </div>

        <Card>
          <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            Academic Performance
          </p>
          {academicPerformance.error ? (
            <EmptyState
              title="Could not load academic performance"
              description={academicPerformance.error.message}
            />
          ) : (
            <DataTable
              columns={assessmentColumns}
              rows={academicPerformance.data ?? []}
              rowKey={(a) => a.id}
              emptyMessage="No academic assessments recorded yet."
            />
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
