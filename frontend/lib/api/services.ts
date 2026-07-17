import apiClient from './client'

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/api/v2/auth/login', { email, password }).then((r) => r.data),
  logout: () => apiClient.post('/api/v2/auth/logout').then((r) => r.data),
}

export const studentAPI = {
  getBySchool: (schoolId: string) =>
    apiClient.get(`/api/v2/students/school/${schoolId}`).then((r) => r.data),
  getById: (studentId: string) =>
    apiClient.get(`/api/v2/students/${studentId}`).then((r) => r.data),
  create: (data: any) => apiClient.post('/api/v2/students', data).then((r) => r.data),
}

export const schoolAPI = {
  getMetrics: (schoolId: string) =>
    apiClient.get(`/api/v2/schools/${schoolId}/metrics`).then((r) => r.data),
  getById: (schoolId: string) =>
    apiClient.get(`/api/v2/schools/${schoolId}`).then((r) => r.data),
}

export const assessmentAPI = {
  getBySchool: (schoolId: string) =>
    apiClient.get(`/api/v2/assessments/school/${schoolId}`).then((r) => r.data),
  getById: (assessmentId: string) =>
    apiClient.get(`/api/v2/assessments/${assessmentId}`).then((r) => r.data),
  create: (data: any) =>
    apiClient.post('/api/v2/assessments/create', data).then((r) => r.data),
}

export const staffAPI = {
  getBySchool: (schoolId: string) =>
    apiClient.get(`/api/v2/staff/school/${schoolId}`).then((r) => r.data),
  create: (data: any) => apiClient.post('/api/v2/staff', data).then((r) => r.data),
}

export const classAPI = {
  // Classes are derived from enrolled students' grade/section — there is no
  // standalone "class" entity, so this list is read-only.
  getBySchool: (schoolId: string) =>
    apiClient.get(`/api/v2/students/school/${schoolId}/classes`).then((r) => r.data),
}

export const attendanceAPI = {
  getByClass: (schoolId: string, gradeLevel: number, classSection: string, date: string) =>
    apiClient
      .get('/api/v2/attendance', { params: { schoolId, gradeLevel, classSection, date } })
      .then((r) => r.data),
  bulkMark: (
    schoolId: string,
    date: string,
    records: { studentId: string; status: string }[]
  ) =>
    apiClient
      .post('/api/v2/attendance/bulk', { schoolId, date, records })
      .then((r) => r.data),
}

export const reportingAPI = {
  getSchoolMetrics: (schoolId: string) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    return apiClient
      .get(`/api/v2/reports/school/${schoolId}/performance`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      })
      .then((r) => r.data)
  },
}
