import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';

export default function SchoolAdminDashboardPage() {
  return (
    <DashboardShell title="School Admin Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Students" value="—" hint="This school year" />
        <StatCard label="Staff Members" value="—" hint="Teaching & non-teaching" />
        <StatCard label="Attendance Rate" value="—" hint="Last 30 days" />
        <StatCard label="Open Referrals" value="—" hint="Counsellor follow-ups" />
      </div>
    </DashboardShell>
  );
}
