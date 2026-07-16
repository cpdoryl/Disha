'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { dashboardPathForRole } from '@/lib/roles';

export default function DashboardIndexPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    router.replace(user ? dashboardPathForRole(user.role) : '/login');
  }, [router, user]);

  return null;
}
