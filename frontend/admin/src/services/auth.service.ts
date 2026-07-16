import { http } from '@/lib/http';
import type { LoginResponse } from '@/types/auth';

export const authService = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  logout: () => http.post('/auth/logout'),
};
