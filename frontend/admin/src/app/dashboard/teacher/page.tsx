'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { studentService } from '@/services/student.service';

export default function TeacherDashboardPage() {
  const { schoolId } = useAuth();
  const hasSchool = Boolean(schoolId);

  const students = useAsync(() => studentService.listBySchool(schoolId!), [schoolId], hasSchool);
  const activeCount = students.data?.filter((s) => s.status === 'active').length ?? 0;

  return (
    <DashboardShell title="Teacher Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={students.data ? activeCount : '—'}
            hint="Active, this school"
            isLoading={students.isLoading}
          />
          <StatCard label="Pending Assessments" value="—" hint="Backend endpoint not yet available" />
          <StatCard label="Today's Attendance" value="—" hint="Backend endpoint not yet available" />
          <StatCard label="Announcements" value="—" hint="Backend endpoint not yet available" />
        </div>

        {students.error ? (
          <EmptyState title="Could not load students" description={students.error.message} />
        ) : (
          <StudentTable students={students.data ?? []} title="My School's Students" />
        )}
      </div>
    </DashboardShell>
  );
}
