'use client';

import { ReactNode, useMemo, useState } from 'react';
import clsx from 'clsx';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({ columns, rows, rowKey, emptyMessage }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;

    return [...rows].sort((a, b) => {
      const aValue = column.sortValue!(a);
      const bValue = column.sortValue!(b);
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [rows, sort, columns]);

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    setSort((prev) => {
      if (prev?.key !== column.key) return { key: column.key, direction: 'asc' };
      return { key: column.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {emptyMessage ?? 'No records found.'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                onClick={() => toggleSort(column)}
                className={clsx(
                  'px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400',
                  column.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                )}
              >
                {column.header}
                {sort?.key === column.key && (sort.direction === 'asc' ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sortedRows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
