import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';

export default function ParentDashboardPage() {
  return (
    <DashboardShell title="Parent Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Child Performance" value="—" hint="Latest assessment" />
        <StatCard label="Attendance Record" value="—" hint="This term" />
        <StatCard label="Notifications" value="—" hint="Unread" />
        <StatCard label="Messages" value="—" hint="From teachers" />
      </div>
    </DashboardShell>
  );
}
