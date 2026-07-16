import { DashboardShell } from '@/components/layout/DashboardShell';
import { EmptyState } from '@/components/ui/EmptyState';

export default function StudentDashboardPage() {
  return (
    <DashboardShell title="Student Dashboard">
      <EmptyState
        title="Student self-service data isn't available yet"
        description="The backend has no endpoint that maps a logged-in student user to their student record (assessment scores, attendance, announcements). This needs a 'my profile' endpoint added to the API before this dashboard can show real data."
      />
    </DashboardShell>
  );
}
