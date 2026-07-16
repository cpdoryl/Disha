'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { useAsync } from '@/hooks/useAsync';
import { studentService } from '@/services/student.service';
import { feeService } from '@/services/fee.service';

export default function ParentDashboardPage() {
  const children = useAsync(() => studentService.getMyChildren(), []);
  const childIds = children.data?.map((c) => c.id).join(',') ?? '';

  const feeSummaries = useAsync(
    () => Promise.all((children.data ?? []).map((c) => feeService.getFeeLedgerByStudent(c.id))),
    [childIds],
    Boolean(children.data?.length),
  );

  const outstandingFees = (feeSummaries.data ?? [])
    .flat()
    .filter((entry) => entry.status !== 'paid' && entry.status !== 'waived').length;

  return (
    <DashboardShell title="Parent Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="My Children"
            value={children.data?.length ?? '—'}
            isLoading={children.isLoading}
          />
          <StatCard
            label="Outstanding Fee Entries"
            value={children.data?.length ? outstandingFees : '—'}
            isLoading={feeSummaries.isLoading}
          />
          <StatCard label="Notifications" value="—" hint="Backend endpoint not yet available" />
          <StatCard label="Messages" value="—" hint="Backend endpoint not yet available" />
        </div>

        {children.error ? (
          <EmptyState
            title="Could not load your children"
            description="Your account may not be linked to a student record yet — contact your school admin to have it linked."
          />
        ) : (
          <StudentTable students={children.data ?? []} title="My Children" />
        )}
      </div>
    </DashboardShell>
  );
}
