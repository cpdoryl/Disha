'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { assessmentAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/store/authStore'

const assessmentSchema = z.object({
  title: z.string().min(3, 'Title required'),
  subject: z.string().min(1, 'Subject required'),
  totalMarks: z.string().min(1, 'Total marks required'),
  dueDate: z.string().min(1, 'Due date required'),
})

type AssessmentFormData = z.infer<typeof assessmentSchema>

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
      // API endpoint needed: GET /api/v2/assessments/school/:schoolId
      const data = await assessmentAPI.getById('dummy') // Placeholder
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
        totalMarks: parseInt(data.totalMarks),
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
          <p className="text-gray-600 mt-2">Create and manage assessments and quizzes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Create Assessment'}
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
          <h2 className="text-lg font-semibold mb-4">Create New Assessment</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Assessment title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  {...register('subject')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                </select>
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks
                </label>
                <input
                  {...register('totalMarks')}
                  type="number"
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.totalMarks && <p className="text-red-500 text-sm mt-1">{errors.totalMarks.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Assessment'}
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
              No assessments found
            </div>
          ) : (
            assessments.map((assessment) => (
          <div
            key={assessment.id}
            onClick={() => setSelectedAssessment(assessment)}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                <p className="text-sm text-gray-600">{assessment.subject}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  assessment.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : assessment.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {assessment.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Total Marks: <span className="font-semibold text-gray-900">{assessment.totalMarks}</span></p>
              <p>Due: <span className="font-semibold text-gray-900">{assessment.dueDate}</span></p>
              <p>Submissions: <span className="font-semibold text-gray-900">{assessment.submitted}/{assessment.total}</span></p>
            </div>

            {assessment.status === 'Completed' && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600">Average Score</p>
                <p className="text-lg font-bold text-gray-900">{assessment.averageScore}/{assessment.totalMarks}</p>
              </div>
            )}

            <button className="w-full mt-4 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium">
              {assessment.status === 'Completed' ? 'View Results' : 'View Details'}
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
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedAssessment.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedAssessment.subject}</p>
                </div>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Marks</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedAssessment.totalMarks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedAssessment.status}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedAssessment.submitted}/{selectedAssessment.total}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedAssessment.dueDate}</p>
                </div>
              </div>

              {selectedAssessment.status === 'In Progress' && (
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Take Assessment
                </button>
              )}

              {selectedAssessment.status === 'Completed' && (
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="text-sm text-green-800 font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-green-900">
                    {selectedAssessment.averageScore}/{selectedAssessment.totalMarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
