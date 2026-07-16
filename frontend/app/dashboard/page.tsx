'use client'

import { useAuthStore } from '@/lib/store/authStore'
import StatCard from '@/components/dashboard/StatCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', students: 400, attendance: 240 },
  { name: 'Feb', students: 300, attendance: 221 },
  { name: 'Mar', students: 200, attendance: 229 },
  { name: 'Apr', students: 278, attendance: 200 },
  { name: 'May', students: 189, attendance: 218 },
]

export default function DashboardHome() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">Here's your dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value="1,234"
          change="+12%"
          icon="📚"
        />
        <StatCard
          title="Attendance Rate"
          value="94.2%"
          change="+2.1%"
          icon="📊"
        />
        <StatCard
          title="Active Assessments"
          value="18"
          change="+3"
          icon="✅"
        />
        <StatCard
          title="Pending Tasks"
          value="7"
          change="-2"
          icon="⏱️"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="students" fill="#2563eb" />
            <Bar dataKey="attendance" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">✅ Attendance marked for Class A</p>
            <p className="text-gray-600">📝 Assessment results published</p>
            <p className="text-gray-600">👤 Student enrolled in Science course</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Mark Attendance
            </button>
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Create Assessment
            </button>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Send Notification
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Health
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>API Status:</span>
              <span className="text-green-600 font-semibold">✓ Healthy</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-green-600 font-semibold">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span>Load:</span>
              <span className="text-green-600 font-semibold">✓ Normal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
