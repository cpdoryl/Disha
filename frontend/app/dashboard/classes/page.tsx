'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const classSchema = z.object({
  name: z.string().min(2, 'Class name required'),
  section: z.string().min(1, 'Section required'),
  classTeacher: z.string().min(2, 'Class teacher required'),
  strength: z.string().min(1, 'Strength required'),
})

type ClassFormData = z.infer<typeof classSchema>

const mockClasses = [
  {
    id: '1',
    name: 'Class 10',
    section: 'A',
    classTeacher: 'Mrs. Sharma',
    strength: 25,
    studentsPresent: 23,
    averageAttendance: 92,
    subjects: ['Math', 'Science', 'English', 'History'],
  },
  {
    id: '2',
    name: 'Class 10',
    section: 'B',
    classTeacher: 'Mr. Patel',
    strength: 24,
    studentsPresent: 21,
    averageAttendance: 87,
    subjects: ['Math', 'Science', 'English', 'Geography'],
  },
  {
    id: '3',
    name: 'Class 11',
    section: 'A',
    classTeacher: 'Dr. Gupta',
    strength: 20,
    studentsPresent: 19,
    averageAttendance: 95,
    subjects: ['Physics', 'Chemistry', 'Biology', 'English'],
  },
  {
    id: '4',
    name: 'Class 11',
    section: 'B',
    classTeacher: 'Mrs. Khan',
    strength: 18,
    studentsPresent: 16,
    averageAttendance: 89,
    subjects: ['Math', 'Accounts', 'Economics', 'English'],
  },
]

export default function ClassesPage() {
  const [classes, setClasses] = useState(mockClasses)
  const [showForm, setShowForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState<typeof mockClasses[0] | null>(null)
  const [search, setSearch] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  })

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(search.toLowerCase()) ||
    cls.classTeacher.toLowerCase().includes(search.toLowerCase())
  )

  const onSubmit = (data: ClassFormData) => {
    setClasses([
      ...classes,
      {
        id: Date.now().toString(),
        ...data,
        strength: parseInt(data.strength),
        studentsPresent: 0,
        averageAttendance: 0,
        subjects: [],
      },
    ])
    reset()
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-2">Manage classes and sections</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Class'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Class</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g., Class 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <select
                  {...register('section')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                {errors.section && <p className="text-red-500 text-sm mt-1">{errors.section.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Teacher
                </label>
                <input
                  {...register('classTeacher')}
                  type="text"
                  placeholder="Teacher name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.classTeacher && <p className="text-red-500 text-sm mt-1">{errors.classTeacher.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strength
                </label>
                <input
                  {...register('strength')}
                  type="number"
                  placeholder="Number of students"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.strength && <p className="text-red-500 text-sm mt-1">{errors.strength.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Class
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by class name or teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            onClick={() => setSelectedClass(cls)}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {cls.name} - {cls.section}
                </h3>
                <p className="text-gray-600">Teacher: {cls.classTeacher}</p>
              </div>
              <span className="text-3xl font-bold text-blue-600">{cls.strength}</span>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <p>Students Present: <span className="font-semibold text-gray-900">{cls.studentsPresent}/{cls.strength}</span></p>
              <p>Attendance: <span className="font-semibold text-green-600">{cls.averageAttendance}%</span></p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">SUBJECTS</p>
              <div className="flex flex-wrap gap-2">
                {cls.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium">
              View Details
            </button>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedClass.name} - {selectedClass.section}
                  </h2>
                  <p className="text-gray-600 mt-1">Class Teacher: {selectedClass.classTeacher}</p>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Strength</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedClass.strength}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Present Today</p>
                  <p className="text-2xl font-bold text-green-900">{selectedClass.studentsPresent}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedClass.averageAttendance}%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Subjects</p>
                  <p className="text-2xl font-bold text-orange-900">{selectedClass.subjects.length}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedClass.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                  View Students
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
                  Manage Teachers
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm">
                  Edit Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
