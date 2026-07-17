'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { staffAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/store/authStore'

const staffSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID required'),
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().optional(),
  position: z.enum(['principal', 'vice_principal', 'teacher', 'counsellor', 'admin_staff']),
  subjectTaught: z.string().optional(),
  gradeLevel: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
})

type StaffFormData = z.infer<typeof staffSchema>

const positionLabels: Record<string, string> = {
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  teacher: 'Teacher',
  counsellor: 'Counsellor',
  admin_staff: 'Admin Staff',
}

export default function StaffPage() {
  const { user } = useAuthStore()
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [filterPosition, setFilterPosition] = useState('All')

  useEffect(() => {
    if (user?.schoolId) {
      fetchStaff()
    }
  }, [user?.schoolId])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await staffAPI.getBySchool(user!.schoolId)
      setStaff(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load staff')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  })

  const fullName = (member: any) => `${member.firstName} ${member.lastName || ''}`.trim()

  const filteredStaff = staff.filter((member) =>
    (filterPosition === 'All' || member.position === filterPosition) &&
    fullName(member).toLowerCase().includes(search.toLowerCase())
  )

  const onSubmit = async (data: StaffFormData) => {
    try {
      setSubmitting(true)
      await staffAPI.create({
        ...data,
        gradeLevel: data.gradeLevel ? parseInt(data.gradeLevel, 10) : undefined,
        schoolId: user!.schoolId,
      })
      await fetchStaff()
      reset()
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create staff')
    } finally {
      setSubmitting(false)
    }
  }

  const positions = ['All', 'principal', 'vice_principal', 'teacher', 'counsellor', 'admin_staff']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">Manage teachers and staff members</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchStaff} className="ml-2 underline font-medium">
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  {...register('employeeId')}
                  type="text"
                  placeholder="EMP-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="First name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  {...register('lastName')}
                  type="text"
                  placeholder="Last name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  {...register('position')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select position</option>
                  {Object.entries(positionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Taught</label>
                <input
                  {...register('subjectTaught')}
                  type="text"
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <input
                  {...register('gradeLevel')}
                  type="number"
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Staff Member'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {positions.map((position) => (
              <option key={position} value={position}>
                {position === 'All' ? 'All Positions' : positionLabels[position]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading staff...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    No staff found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{fullName(member)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.employeeId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{positionLabels[member.position] || member.position}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.subjectTaught || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold capitalize">
                    {member.employmentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => setSelectedStaff(member)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{fullName(selectedStaff)}</h2>
                  <p className="text-gray-600 mt-1">
                    {positionLabels[selectedStaff.position] || selectedStaff.position}
                    {selectedStaff.subjectTaught ? ` • ${selectedStaff.subjectTaught}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-semibold text-gray-900 mt-1">{selectedStaff.employeeId}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Grade Level</p>
                  <p className="font-semibold text-gray-900 mt-1">{selectedStaff.gradeLevel || '-'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedStaff.startDate ? new Date(selectedStaff.startDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Employment Status</p>
                  <p className="font-semibold text-gray-900 mt-1 capitalize">{selectedStaff.employmentStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
