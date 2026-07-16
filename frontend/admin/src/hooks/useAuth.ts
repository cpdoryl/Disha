import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getSessionClaims } from '@/lib/decodeToken';

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    setSchoolId(getSessionClaims()?.schoolId ?? null);
  }, []);

  const signOut = async () => {
    await logout();
    router.push('/login');
  };

  return { user, schoolId, signOut };
}
