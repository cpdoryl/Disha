'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const attendanceByClass = [
  { name: '10-A', attendance: 92 },
  { name: '10-B', attendance: 88 },
  { name: '11-A', attendance: 94 },
  { name: '11-B', attendance: 89 },
]

const performanceData = [
  { name: 'Excellent', value: 18, fill: '#10b981' },
  { name: 'Good', value: 32, fill: '#3b82f6' },
  { name: 'Average', value: 28, fill: '#f59e0b' },
  { name: 'Poor', value: 12, fill: '#ef4444' },
]

const trendData = [
  { week: 'Week 1', avg: 75, total: 120 },
  { week: 'Week 2', avg: 78, total: 128 },
  { week: 'Week 3', avg: 82, total: 135 },
  { week: 'Week 4', avg: 80, total: 130 },
  { week: 'Week 5', avg: 85, total: 142 },
]

const studentPerformance = [
  { name: 'Raj Kumar', math: 85, english: 78, science: 92, history: 88 },
  { name: 'Priya Singh', math: 92, english: 88, science: 85, history: 90 },
  { name: 'Amit Patel', math: 78, english: 82, science: 88, history: 85 },
  { name: 'Neha Gupta', math: 95, english: 92, science: 94, history: 93 },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">View comprehensive performance and attendance reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Average Attendance</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">90.75%</p>
          <p className="text-xs text-green-600 mt-1">↑ 2% from last month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Average Performance</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">82.5%</p>
          <p className="text-xs text-green-600 mt-1">↑ 1.2% from last month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">98</p>
          <p className="text-xs text-blue-600 mt-1">Active students</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Assessments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
          <p className="text-xs text-blue-600 mt-1">Completed this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Class</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceByClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="attendance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avg" stroke="#10b981" name="Average Score" />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Submitted" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Math</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">English</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Science</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">History</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {studentPerformance.map((student, index) => {
                const average = Math.round((student.math + student.english + student.science + student.history) / 4)
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.math}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.english}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.science}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.history}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        average >= 90 ? 'bg-green-100 text-green-800' :
                        average >= 80 ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {average}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Export Report</h3>
          <p className="text-sm text-blue-800 mb-4">Download detailed analytics reports</p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Download PDF
          </button>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Email Report</h3>
          <p className="text-sm text-green-800 mb-4">Share reports with stakeholders</p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Send Email
          </button>
        </div>

        <div className="bg-purple-50 rounded-lg shadow p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Schedule Report</h3>
          <p className="text-sm text-purple-800 mb-4">Set up automatic report generation</p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            Configure
          </button>
        </div>
      </div>
    </div>
  )
}
