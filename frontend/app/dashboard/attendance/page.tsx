'use client'

import { useState, useEffect } from 'react'
import { attendanceAPI } from '@/lib/api/services'
import { useAuthStore } from '@/lib/store/authStore'

function parseClass(selectedClass: string): { gradeLevel: number; classSection: string } {
  const [grade, section] = selectedClass.split('-')
  return { gradeLevel: parseInt(grade, 10), classSection: section }
}

export default function AttendancePage() {
  const { user } = useAuthStore()
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedClass, setSelectedClass] = useState('10-A')

  useEffect(() => {
    if (user?.schoolId) {
      fetchAttendance()
    }
  }, [selectedDate, selectedClass, user?.schoolId])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      setError(null)
      const { gradeLevel, classSection } = parseClass(selectedClass)
      const data = await attendanceAPI.getByClass(user!.schoolId, gradeLevel, classSection, selectedDate)
      setAttendanceData(Array.isArray(data) ? data : data.records || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attendance')
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }

  const toggleAttendance = (id: string) => {
    setAttendanceData(
      attendanceData.map((record) =>
        record.id === id
          ? {
              ...record,
              status: record.status === 'Present' ? 'Absent' : 'Present',
            }
          : record
      )
    )
  }

  const saveAttendance = async () => {
    try {
      setSaving(true)
      setError(null)
      const records = attendanceData.map((record) => ({
        studentId: record.id,
        status: record.status,
      }))
      await attendanceAPI.bulkMark(user!.schoolId, selectedDate, records)
      alert('Attendance saved successfully!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = attendanceData.filter((r) => r.status === 'Present').length
  const absentCount = attendanceData.filter((r) => r.status === 'Absent').length
  const percentage = Math.round((presentCount / attendanceData.length) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-2">Mark and track student attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceData.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-800 text-sm font-medium">Present</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{presentCount}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <p className="text-red-800 text-sm font-medium">Absent</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{absentCount}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-blue-800 text-sm font-medium">Attendance %</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{percentage}%</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchAttendance} className="ml-2 underline font-medium">
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mark Attendance</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="10-A">Class 10-A</option>
                <option value="10-B">Class 10-B</option>
                <option value="11-A">Class 11-A</option>
                <option value="11-B">Class 11-B</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={saveAttendance}
                disabled={saving || loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading attendance...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                      No students found for this class
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{record.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.rollNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleAttendance(record.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend</h3>
          <div className="space-y-3">
            {[
              { day: 'Monday', percent: 92 },
              { day: 'Tuesday', percent: 88 },
              { day: 'Wednesday', percent: 94 },
              { day: 'Thursday', percent: 89 },
              { day: 'Friday', percent: 91 },
            ].map((item) => (
              <div key={item.day}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">{item.day}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Wise Report</h3>
          <div className="space-y-3">
            {[
              { class: '10-A', percent: 92, present: 23, total: 25 },
              { class: '10-B', percent: 88, present: 22, total: 25 },
              { class: '11-A', percent: 94, present: 19, total: 20 },
              { class: '11-B', percent: 89, present: 16, total: 18 },
            ].map((item) => (
              <div key={item.class} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{item.class}</p>
                  <p className="text-xs text-gray-600">{item.present}/{item.total} present</p>
                </div>
                <span className="text-lg font-bold text-gray-900">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
