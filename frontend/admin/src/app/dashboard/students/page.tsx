'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/student.service';

function StudentsListContent() {
  const searchParams = useSearchParams();
  const { schoolId: ownSchoolId, user } = useAuth();
  const schoolId = searchParams.get('schoolId') ?? ownSchoolId;
  const hasSchool = Boolean(schoolId);

  const students = useAsync(() => studentService.listBySchool(schoolId!), [schoolId], hasSchool);

  if (!hasSchool) {
    return (
      <EmptyState
        title="Select a school first"
        description={
          user?.role === 'ryl_admin'
            ? 'Pick a school from the Schools list to view its students.'
            : 'Your account has no school associated with it.'
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href={`/dashboard/students/new?schoolId=${schoolId}`}>
          <Button className="w-auto">+ New Student</Button>
        </Link>
      </div>

      {students.error ? (
        <EmptyState title="Could not load students" description={students.error.message} />
      ) : (
        <StudentTable students={students.data ?? []} title="Students" />
      )}
    </div>
  );
}

export default function StudentsListPage() {
  return (
    <DashboardShell title="Students">
      <Suspense fallback={null}>
        <StudentsListContent />
      </Suspense>
    </DashboardShell>
  );
}
