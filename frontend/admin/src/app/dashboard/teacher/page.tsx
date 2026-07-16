import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';

export default function TeacherDashboardPage() {
  return (
    <DashboardShell title="Teacher Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Classes" value="—" />
        <StatCard label="Students" value="—" hint="Across my classes" />
        <StatCard label="Pending Assessments" value="—" hint="To grade" />
        <StatCard label="Today's Attendance" value="—" hint="Marked" />
      </div>
    </DashboardShell>
  );
}
