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
import type { CommunicationEntry } from '@/types/org';

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
          <StatCard label="Pending Assessments" value="—" hint="Backend endpoint not yet available" />
          <StatCard label="Today's Attendance" value="—" hint="Backend endpoint not yet available" />
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
