'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { schoolService } from '@/services/school.service';
import { auditService } from '@/services/audit.service';
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
            label="Students (home school)"
            value={metrics.data?.studentCount ?? '—'}
            isLoading={metrics.isLoading}
          />
          <StatCard
            label="Staff (home school)"
            value={metrics.data?.staffCount ?? '—'}
            isLoading={metrics.isLoading}
          />
          <StatCard label="Total Schools (org-wide)" value="—" hint="Backend endpoint not yet available" />
          <StatCard label="Total Users" value="—" hint="Backend endpoint not yet available" />
        </div>

        {!hasSchool && (
          <EmptyState
            title="No school associated with this account"
            description="Organization-wide stats require a new backend endpoint that doesn't exist yet — the current API only exposes data scoped to a single school."
          />
        )}

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
      </div>
    </DashboardShell>
  );
}
