import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
      {...props}
    />
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, hint, isLoading }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      ) : (
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </Card>
  );
}
