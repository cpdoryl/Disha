import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';

export default function AdminDashboardPage() {
  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Schools" value="—" hint="Across all organizations" />
        <StatCard label="Total Users" value="—" hint="Active accounts" />
        <StatCard label="System Health" value="—" hint="Uptime & error rate" />
        <StatCard label="Active Assessments" value="—" hint="In progress" />
      </div>
    </DashboardShell>
  );
}
