'use client'

import { useState, useEffect } from 'react'
import { classAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/store/authStore'

export default function ClassesPage() {
  const { user } = useAuthStore()
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.schoolId) {
      fetchClasses()
    }
  }, [user?.schoolId])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await classAPI.getBySchool(user!.schoolId)
      setClasses(Array.isArray(data) ? data : data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load classes')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter((cls) =>
    `${cls.name} ${cls.section}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
        <p className="text-gray-600 mt-2">
          Classes are derived automatically from enrolled students&apos; grade and section
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchClasses} className="ml-2 underline font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by class name or section..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-600">
              No classes found — add students to a grade and section to see it here
            </div>
          ) : (
            filteredClasses.map((cls) => (
              <div key={cls.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {cls.name} - {cls.section}
                  </h3>
                  <span className="text-3xl font-bold text-blue-600">{cls.strength}</span>
                </div>
                <p className="text-sm text-gray-600">Enrolled students</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
