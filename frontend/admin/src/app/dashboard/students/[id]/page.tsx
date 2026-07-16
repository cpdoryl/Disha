'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, StatCard } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/student.service';
import { isoDaysAgo, isoNow } from '@/lib/dates';
import type { AcademicAssessment, StudentStatus } from '@/types/student';

const assessmentColumns: DataTableColumn<AcademicAssessment>[] = [
  {
    key: 'assessmentDate',
    header: 'Date',
    sortable: true,
    sortValue: (a) => a.assessmentDate,
    render: (a) => new Date(a.assessmentDate).toLocaleDateString(),
  },
  { key: 'subject', header: 'Subject', render: (a) => a.subject },
  {
    key: 'score',
    header: 'Score',
    sortable: true,
    sortValue: (a) => a.percentage,
    render: (a) => `${a.scoreObtained}/${a.scoreMax} (${Math.round(a.percentage)}%)`,
  },
];

const CAN_EDIT_STATUS = new Set(['ryl_admin', 'school_admin', 'teacher']);
const CAN_VIEW_REPORTS = new Set(['ryl_admin', 'school_admin', 'teacher', 'parent']);

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusValue, setStatusValue] = useState<StudentStatus | ''>('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const canEditStatus = Boolean(user && CAN_EDIT_STATUS.has(user.role));
  const canViewReports = Boolean(user && CAN_VIEW_REPORTS.has(user.role));

  const student = useAsync(() => studentService.getById(params.id), [params.id, refreshKey]);
  const attendance = useAsync(
    () => studentService.getAttendanceReport(params.id, isoDaysAgo(90), isoNow()),
    [params.id],
    canViewReports,
  );
  const academicPerformance = useAsync(
    () => studentService.getAcademicPerformance(params.id),
    [params.id],
    canViewReports,
  );

  const handleUpdateStatus = async () => {
    if (!statusValue) return;
    setStatusError(null);
    setIsUpdatingStatus(true);
    try {
      await studentService.updateStatus(params.id, statusValue);
      setRefreshKey((k) => k + 1);
      setStatusValue('');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (student.error) {
    return (
      <DashboardShell title="Student">
        <EmptyState
          title="Could not load this student"
          description={
            student.error.message.includes('403')
              ? "You don't have permission to view this student."
              : student.error.message
          }
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={student.data ? `${student.data.firstName} ${student.data.lastName ?? ''}` : 'Student'}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Grade / Section"
            value={
              student.data
                ? `${student.data.gradeLevel ?? '—'}${student.data.classSection ? `-${student.data.classSection}` : ''}`
                : '—'
            }
            isLoading={student.isLoading}
          />
          <StatCard label="Enrollment #" value={student.data?.enrollmentNumber ?? '—'} isLoading={student.isLoading} />
          <StatCard label="Status" value={student.data?.status ?? '—'} isLoading={student.isLoading} />
          <StatCard label="Guardian" value={student.data?.guardianName ?? '—'} isLoading={student.isLoading} />
        </div>

        {canEditStatus && (
          <Card>
            <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Update Status</p>
            <div className="flex items-end gap-3">
              <div className="w-48">
                <Select
                  label="New status"
                  name="status"
                  placeholder="Select status"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as StudentStatus)}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'withdrawn', label: 'Withdrawn' },
                    { value: 'transferred', label: 'Transferred' },
                    { value: 'graduated', label: 'Graduated' },
                  ]}
                />
              </div>
              <Button
                className="w-auto"
                onClick={handleUpdateStatus}
                isLoading={isUpdatingStatus}
                disabled={!statusValue}
              >
                Update
              </Button>
            </div>
            {statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}
          </Card>
        )}

        {canViewReports && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <StatCard
                label="Attendance (last 90 days)"
                value={attendance.data ? `${Math.round(attendance.data.attendancePercentage)}%` : '—'}
                hint={
                  attendance.data ? `${attendance.data.presentDays} of ${attendance.data.totalDays} days` : undefined
                }
                isLoading={attendance.isLoading}
              />
              <StatCard
                label="Assessments Recorded"
                value={academicPerformance.data?.length ?? '—'}
                isLoading={academicPerformance.isLoading}
              />
            </div>

            <Card>
              <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Academic Performance</p>
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
          </>
        )}
      </div>
    </DashboardShell>
  );
}
