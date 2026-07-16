'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { schoolService } from '@/services/school.service';
import { auditService } from '@/services/audit.service';
import { userService } from '@/services/user.service';
import type { SuspiciousActivityEntry } from '@/types/audit';

const suspiciousColumns: DataTableColumn<SuspiciousActivityEntry>[] = [
  { key: 'userId', header: 'User', render: (r) => r.userId },
  { key: 'actionCount', header: 'Actions', sortable: true, sortValue: (r) => r.actionCount, render: (r) => r.actionCount },
  {
    key: 'timeSpanMinutes',
    header: 'Time span',
    render: (r) => `${r.timeSpanMinutes.toFixed(1)} min`,
  },
];

export default function AdminDashboardPage() {
  const { schoolId } = useAuth();
  const hasSchool = Boolean(schoolId);

  const orgOverview = useAsync(() => userService.getOrgOverview(), []);
  const metrics = useAsync(() => schoolService.getMetrics(schoolId!), [schoolId], hasSchool);
  const suspiciousActivity = useAsync(
    () => auditService.getSuspiciousActivity(schoolId!),
    [schoolId],
    hasSchool,
  );

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Schools (org-wide)"
            value={orgOverview.data?.totalSchools ?? '—'}
            isLoading={orgOverview.isLoading}
          />
          <StatCard
            label="Total Users"
            value={orgOverview.data?.totalUsers ?? '—'}
            hint={orgOverview.data ? `${orgOverview.data.activeUsers} active` : undefined}
            isLoading={orgOverview.isLoading}
          />
          <StatCard
            label="School Admins"
            value={orgOverview.data?.usersByType.school_admin ?? '—'}
            isLoading={orgOverview.isLoading}
          />
          <StatCard
            label="Teachers"
            value={orgOverview.data?.usersByType.teacher ?? '—'}
            isLoading={orgOverview.isLoading}
          />
        </div>

        {orgOverview.error && (
          <EmptyState title="Could not load organization stats" description={orgOverview.error.message} />
        )}

        {hasSchool && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Students (home school)"
              value={metrics.data?.studentCount ?? '—'}
              isLoading={metrics.isLoading}
            />
            <StatCard
              label="Staff (home school)"
              value={metrics.data?.staffCount ?? '—'}
              isLoading={metrics.isLoading}
            />
          </div>
        )}

        {hasSchool && (
          <div>
            <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              Suspicious Activity (10+ actions within 60 minutes)
            </p>
            {suspiciousActivity.error ? (
              <EmptyState title="Could not load audit data" description={suspiciousActivity.error.message} />
            ) : (
              <DataTable
                columns={suspiciousColumns}
                rows={suspiciousActivity.data ?? []}
                rowKey={(r) => r.userId}
                emptyMessage="No suspicious activity detected."
              />
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
