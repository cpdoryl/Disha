import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import { clearTokens, setTokens, setUser as persistUser } from '@/lib/tokens';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticating: false,
  error: null,

  login: async (email, password) => {
    set({ isAuthenticating: true, error: null });
    try {
      const response = await authService.login(email, password);
      setTokens(response.accessToken, response.refreshToken, response.user.role);
      persistUser(response.user);
      set({ user: response.user, isAuthenticating: false });
      return response.user;
    } catch (err) {
      set({ isAuthenticating: false, error: 'Invalid email or password.' });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      clearTokens();
      set({ user: null });
    }
  },

  setUser: (user) => set({ user }),
}));
