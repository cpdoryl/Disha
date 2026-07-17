'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { assessmentAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/store/authStore'

const assessmentSchema = z.object({
  cycleName: z.string().min(3, 'Cycle name required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
})

type AssessmentFormData = z.infer<typeof assessmentSchema>

const statusStyles: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

export default function AssessmentsPage() {
  const { user } = useAuthStore()
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null)

  useEffect(() => {
    if (user?.schoolId) {
      fetchAssessments()
    }
  }, [user?.schoolId])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await assessmentAPI.getBySchool(user!.schoolId)
      setAssessments(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assessments')
      setAssessments([])
    } finally {
      setLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
  })

  const onSubmit = async (data: AssessmentFormData) => {
    try {
      setSubmitting(true)
      await assessmentAPI.create({
        ...data,
        schoolId: user!.schoolId,
      })
      await fetchAssessments()
      reset()
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assessment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-2">Create and manage diagnostic assessment cycles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Create Assessment Cycle'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchAssessments} className="ml-2 underline font-medium">
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Assessment Cycle</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cycle Name
                </label>
                <input
                  {...register('cycleName')}
                  type="text"
                  placeholder="e.g., Term1_2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.cycleName && <p className="text-red-500 text-sm mt-1">{errors.cycleName.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Assessment Cycle'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-600">
              No assessment cycles found
            </div>
          ) : (
            assessments.map((assessment) => (
              <div
                key={assessment.id}
                onClick={() => setSelectedAssessment(assessment)}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">{assessment.cycleName}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      statusStyles[assessment.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {assessment.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>Start: <span className="font-semibold text-gray-900">{assessment.startDate ? new Date(assessment.startDate).toLocaleDateString() : '-'}</span></p>
                  <p>End: <span className="font-semibold text-gray-900">{assessment.endDate ? new Date(assessment.endDate).toLocaleDateString() : '-'}</span></p>
                </div>

                <button className="w-full mt-4 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium">
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAssessment.cycleName}</h2>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedAssessment.description && (
                <p className="text-gray-700">{selectedAssessment.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{selectedAssessment.status}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedAssessment.startDate ? new Date(selectedAssessment.startDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedAssessment.endDate ? new Date(selectedAssessment.endDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
