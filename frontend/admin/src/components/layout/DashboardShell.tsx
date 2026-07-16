'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABEL, dashboardPathForRole } from '@/lib/roles';

const NAV_LINKS_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  ryl_admin: [
    { href: '/dashboard/schools', label: 'Schools' },
    { href: '/dashboard/students', label: 'Students' },
  ],
  school_admin: [{ href: '/dashboard/students', label: 'Students' }],
  teacher: [{ href: '/dashboard/students', label: 'Students' }],
};

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const navLinks = user ? NAV_LINKS_BY_ROLE[user.role] ?? [] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Disha</p>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right text-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-gray-500 dark:text-gray-400">{ROLE_LABEL[user.role]}</p>
              </div>
            )}
            <button
              onClick={signOut}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
        {navLinks.length > 0 && (
          <nav className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6 lg:px-8">
            <Link
              href={user ? dashboardPathForRole(user.role) : '/dashboard'}
              className={clsx(
                'border-b-2 px-3 py-2 text-sm font-medium',
                pathname === (user ? dashboardPathForRole(user.role) : '/dashboard')
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              Dashboard
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'border-b-2 px-3 py-2 text-sm font-medium',
                  pathname?.startsWith(link.href)
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
