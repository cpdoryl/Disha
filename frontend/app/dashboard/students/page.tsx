'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { studentAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/store/authStore'

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().optional(),
  enrollmentNumber: z.string().min(1, 'Enrollment number required'),
  gradeLevel: z.string().min(1, 'Grade required'),
  classSection: z.string().min(1, 'Section required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')),
})

type StudentFormData = z.infer<typeof studentSchema>

export default function StudentsPage() {
  const { user } = useAuthStore()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!user?.schoolId) return
    fetchStudents()
  }, [user?.schoolId])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await studentAPI.getBySchool(user!.schoolId)
      setStudents(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  })

  const fullName = (student: any) => `${student.firstName} ${student.lastName || ''}`.trim()

  const filteredStudents = students.filter((student) =>
    fullName(student).toLowerCase().includes(search.toLowerCase()) ||
    student.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
  )

  const onSubmit = async (data: StudentFormData) => {
    try {
      setSubmitting(true)
      await studentAPI.create({
        ...data,
        gradeLevel: parseInt(data.gradeLevel, 10),
        guardianEmail: data.guardianEmail || undefined,
        schoolId: user!.schoolId,
      })

      await fetchStudents()
      reset()
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save student')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage and track student information</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            reset()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchStudents} className="ml-2 underline font-medium">
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Student</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="First name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  placeholder="Last name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Number
                </label>
                <input
                  {...register('enrollmentNumber')}
                  type="text"
                  placeholder="EN-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.enrollmentNumber && <p className="text-red-500 text-sm mt-1">{errors.enrollmentNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <input
                  {...register('gradeLevel')}
                  type="number"
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.gradeLevel && <p className="text-red-500 text-sm mt-1">{errors.gradeLevel.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <input
                  {...register('classSection')}
                  type="text"
                  placeholder="A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.classSection && <p className="text-red-500 text-sm mt-1">{errors.classSection.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Email
                </label>
                <input
                  {...register('guardianEmail')}
                  type="email"
                  placeholder="guardian@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.guardianEmail && <p className="text-red-500 text-sm mt-1">{errors.guardianEmail.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Add Student'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by name or enrollment number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Enrollment #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Guardian Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{fullName(student)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.enrollmentNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.gradeLevel}{student.classSection ? `-${student.classSection}` : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.guardianEmail || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold capitalize">
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </>
        )}
      </div>
    </div>
  )
}
