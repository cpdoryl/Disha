'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getUser } from '@/lib/tokens';

export function AuthHydrator() {
  useEffect(() => {
    const cookieUser = getUser();
    if (cookieUser) {
      useAuthStore.getState().setUser(cookieUser);
    }
  }, []);

  return null;
}
