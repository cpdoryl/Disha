const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // response body wasn't JSON, fall back to statusText
    }
    throw new ApiRequestError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface Student {
  id: string;
  enrollmentNumber: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  gradeLevel: number | null;
  classSection: string | null;
  status: string;
  guardianName: string | null;
  guardianPhone: string | null;
}

export interface Assessment {
  id: string;
  cycleName: string;
  status: "draft" | "active" | "closed" | "archived";
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  position: string;
  subjectTaught: string | null;
  gradeLevel: number | null;
  employmentStatus: string;
  email: string | null;
  phone: string | null;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/v2/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getSchool: (schoolId: string, token: string) =>
    request(`/api/v2/schools/${schoolId}`, {}, token),

  getSchoolMetrics: (schoolId: string, token: string) =>
    request(`/api/v2/schools/${schoolId}/metrics`, {}, token),

  getStudentsBySchool: (schoolId: string, token: string) =>
    request<Student[]>(`/api/v2/students/school/${schoolId}`, {}, token),

  getAssessmentsBySchool: (schoolId: string, token: string) =>
    request<Assessment[]>(`/api/v2/assessments/school/${schoolId}`, {}, token),

  getStaffBySchool: (schoolId: string, token: string) =>
    request<Staff[]>(`/api/v2/staff/school/${schoolId}`, {}, token),
};
