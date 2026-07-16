'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import type { Student } from '@/types/student';

const columns: DataTableColumn<Student>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    sortValue: (s) => `${s.lastName ?? ''} ${s.firstName}`.toLowerCase(),
    render: (s) => (
      <Link href={`/dashboard/students/${s.id}`} className="font-medium text-indigo-600 hover:underline">
        {s.firstName} {s.lastName ?? ''}
      </Link>
    ),
  },
  {
    key: 'enrollmentNumber',
    header: 'Enrollment #',
    sortable: true,
    sortValue: (s) => s.enrollmentNumber,
    render: (s) => s.enrollmentNumber,
  },
  {
    key: 'grade',
    header: 'Grade / Section',
    sortable: true,
    sortValue: (s) => s.gradeLevel ?? 0,
    render: (s) => (s.gradeLevel ? `Grade ${s.gradeLevel}${s.classSection ? `-${s.classSection}` : ''}` : '—'),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    sortValue: (s) => s.status,
    render: (s) => (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize text-green-800 dark:bg-green-900 dark:text-green-200">
        {s.status}
      </span>
    ),
  },
  {
    key: 'guardian',
    header: 'Guardian',
    render: (s) => s.guardianName ?? '—',
  },
];

export function StudentTable({ students, title }: { students: Student[]; title: string }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((s) =>
      `${s.firstName} ${s.lastName ?? ''} ${s.enrollmentNumber}`.toLowerCase().includes(query),
    );
  }, [students, search]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title} ({filtered.length})
        </p>
        <SearchInput
          placeholder="Search by name or enrollment #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(s) => s.id} emptyMessage="No students found." />
    </Card>
  );
}
