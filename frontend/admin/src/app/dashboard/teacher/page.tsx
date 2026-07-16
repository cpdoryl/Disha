'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { studentService } from '@/services/student.service';
import { communicationService } from '@/services/communication.service';
import { assessmentService } from '@/services/assessment.service';
import type { CommunicationEntry } from '@/types/org';
import type { Assessment } from '@/types/assessment';

const pendingAssessmentColumns: DataTableColumn<Assessment>[] = [
  { key: 'cycleName', header: 'Cycle', render: (a) => a.cycleName },
  { key: 'description', header: 'Description', render: (a) => a.description ?? '—' },
  {
    key: 'endDate',
    header: 'Deadline',
    sortable: true,
    sortValue: (a) => a.endDate,
    render: (a) => new Date(a.endDate).toLocaleDateString(),
  },
];

const communicationColumns: DataTableColumn<CommunicationEntry>[] = [
  {
    key: 'queryDate',
    header: 'Date',
    sortable: true,
    sortValue: (c) => c.queryDate,
    render: (c) => new Date(c.queryDate).toLocaleDateString(),
  },
  { key: 'queryTopic', header: 'Topic', render: (c) => c.queryTopic },
  { key: 'queryChannel', header: 'Channel', render: (c) => c.queryChannel },
  {
    key: 'status',
    header: 'Status',
    render: (c) => (
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800 dark:bg-gray-700 dark:text-gray-200">
        {c.status}
      </span>
    ),
  },
];

export default function TeacherDashboardPage() {
  const { schoolId } = useAuth();
  const hasSchool = Boolean(schoolId);

  const students = useAsync(() => studentService.listBySchool(schoolId!), [schoolId], hasSchool);
  const activeCount = students.data?.filter((s) => s.status === 'active').length ?? 0;

  const communications = useAsync(
    () => communicationService.getBySchool(schoolId!),
    [schoolId],
    hasSchool,
  );
  const pendingCommunications = communications.data?.filter((c) => c.status === 'pending').length ?? 0;

  const pendingAssessments = useAsync(() => assessmentService.getMyPending(), []);

  const todayAttendance = useAsync(
    () => studentService.getTodayAttendanceSummary(schoolId!),
    [schoolId],
    hasSchool,
  );
  const attendanceHint = todayAttendance.data
    ? `${todayAttendance.data.presentCount} present, ${todayAttendance.data.absentCount} absent, ${todayAttendance.data.unmarkedCount} unmarked`
    : undefined;

  return (
    <DashboardShell title="Teacher Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={students.data ? activeCount : '—'}
            hint="Active, this school"
            isLoading={students.isLoading}
          />
          <StatCard
            label="Pending Assessments"
            value={pendingAssessments.data ? pendingAssessments.data.length : '—'}
            hint="Awaiting your response"
            isLoading={pendingAssessments.isLoading}
          />
          <StatCard
            label="Today's Attendance"
            value={todayAttendance.data ? todayAttendance.data.markedCount : '—'}
            hint={attendanceHint ?? 'Marked so far today'}
            isLoading={todayAttendance.isLoading}
          />
          <StatCard
            label="Pending Parent Queries"
            value={communications.data ? pendingCommunications : '—'}
            hint="Awaiting a response"
            isLoading={communications.isLoading}
          />
        </div>

        {students.error ? (
          <EmptyState title="Could not load students" description={students.error.message} />
        ) : (
          <StudentTable students={students.data ?? []} title="My School's Students" />
        )}

        <Card>
          <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            My Pending Assessments
          </p>
          {pendingAssessments.error ? (
            <EmptyState
              title="Could not load pending assessments"
              description={pendingAssessments.error.message}
            />
          ) : (
            <DataTable
              columns={pendingAssessmentColumns}
              rows={pendingAssessments.data ?? []}
              rowKey={(a) => a.id}
              emptyMessage="No pending assessments — you're all caught up."
            />
          )}
        </Card>

        <Card>
          <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            Recent Parent Communications
          </p>
          {communications.error ? (
            <EmptyState title="Could not load communications" description={communications.error.message} />
          ) : (
            <DataTable
              columns={communicationColumns}
              rows={communications.data ?? []}
              rowKey={(c) => c.id}
              emptyMessage="No parent communications logged yet."
            />
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
