'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const studentSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  rollNumber: z.string().min(1, 'Roll number required'),
  className: z.string().min(1, 'Class required'),
})

type StudentFormData = z.infer<typeof studentSchema>

const mockStudents = [
  {
    id: '1',
    name: 'Raj Kumar',
    email: 'raj@example.com',
    rollNumber: '001',
    className: '10-A',
    attendance: '92%',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    rollNumber: '002',
    className: '10-A',
    attendance: '88%',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    rollNumber: '003',
    className: '10-B',
    attendance: '85%',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Neha Gupta',
    email: 'neha@example.com',
    rollNumber: '004',
    className: '10-B',
    attendance: '95%',
    status: 'Active',
  },
]

export default function StudentsPage() {
  const [students, setStudents] = useState(mockStudents)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  })

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase()) ||
    student.rollNumber.includes(search)
  )

  const onSubmit = (data: StudentFormData) => {
    if (editingId) {
      setStudents(
        students.map((s) =>
          s.id === editingId
            ? { ...s, ...data, attendance: '0%' }
            : s
        )
      )
      setEditingId(null)
    } else {
      setStudents([
        ...students,
        {
          id: Date.now().toString(),
          ...data,
          attendance: '0%',
          status: 'Active',
        },
      ])
    }
    reset()
    setShowForm(false)
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
            setEditingId(null)
            reset()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Student name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <input
                  {...register('rollNumber')}
                  type="text"
                  placeholder="001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.rollNumber && <p className="text-red-500 text-sm mt-1">{errors.rollNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <input
                  {...register('className')}
                  type="text"
                  placeholder="10-A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.className && <p className="text-red-500 text-sm mt-1">{errors.className.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingId ? 'Update Student' : 'Add Student'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by name, email, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Attendance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.rollNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.className}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.attendance}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setEditingId(student.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setStudents(students.filter((s) => s.id !== student.id))
                      }
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>
    </div>
  )
}
