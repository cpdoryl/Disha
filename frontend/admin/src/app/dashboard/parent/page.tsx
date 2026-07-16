import { DashboardShell } from '@/components/layout/DashboardShell';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ParentDashboardPage() {
  return (
    <DashboardShell title="Parent Dashboard">
      <EmptyState
        title="Parent self-service data isn't available yet"
        description="The backend has no endpoint that maps a logged-in parent user to their children's records (performance, attendance, notifications). This needs a 'my children' endpoint added to the API before this dashboard can show real data."
      />
    </DashboardShell>
  );
}
