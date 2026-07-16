import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';

export default function StudentDashboardPage() {
  return (
    <DashboardShell title="Student Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Courses" value="—" />
        <StatCard label="Assessment Scores" value="—" hint="Average" />
        <StatCard label="Attendance Record" value="—" hint="This term" />
        <StatCard label="Announcements" value="—" hint="Unread" />
      </div>
    </DashboardShell>
  );
}
