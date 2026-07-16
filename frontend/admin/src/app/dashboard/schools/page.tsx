'use client';

import Link from 'next/link';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { useAsync } from '@/hooks/useAsync';
import { schoolService } from '@/services/school.service';
import type { School } from '@/types/school';
import { useMemo, useState } from 'react';

const columns: DataTableColumn<School>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    sortValue: (s) => s.name.toLowerCase(),
    render: (s) => (
      <Link href={`/dashboard/schools/${s.id}`} className="font-medium text-indigo-600 hover:underline">
        {s.name}
      </Link>
    ),
  },
  { key: 'district', header: 'District', sortable: true, sortValue: (s) => s.district ?? '', render: (s) => s.district },
  { key: 'state', header: 'State', render: (s) => s.state ?? '—' },
  {
    key: 'studentCount',
    header: 'Students',
    sortable: true,
    sortValue: (s) => s.studentCount ?? 0,
    render: (s) => s.studentCount ?? '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (s) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          s.isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}
      >
        {s.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

export default function SchoolsListPage() {
  const schools = useAsync(() => schoolService.getAll(), []);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return schools.data ?? [];
    return (schools.data ?? []).filter((s) =>
      `${s.name} ${s.district} ${s.state ?? ''}`.toLowerCase().includes(query),
    );
  }, [schools.data, search]);

  return (
    <DashboardShell title="Schools">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <SearchInput
            placeholder="Search by name, district, or state"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link href="/dashboard/schools/new">
            <Button className="w-auto">+ New School</Button>
          </Link>
        </div>

        {schools.error ? (
          <EmptyState
            title="Could not load schools"
            description={
              schools.error.message.includes('403')
                ? "You don't have permission to view the org-wide school list."
                : schools.error.message
            }
          />
        ) : (
          <Card>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(s) => s.id}
              emptyMessage="No schools found."
            />
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
