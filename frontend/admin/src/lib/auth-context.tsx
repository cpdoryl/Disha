"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId: string;
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "disha_admin_session";

// The login response doesn't include schoolId, but it's embedded in the JWT payload.
function decodeSchoolId(accessToken: string): string {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return typeof payload.schoolId === "string" ? payload.schoolId : "";
  } catch {
    return "";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredSession = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.accessToken);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    const authUser: AuthUser = {
      ...res.user,
      schoolId: decodeSchoolId(res.accessToken),
    };
    const session: StoredSession = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: authUser,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(authUser);
    setToken(res.accessToken);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
