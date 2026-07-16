export type UserRole = 'ryl_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  schoolId: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}
