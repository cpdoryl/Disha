'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const staffSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role required'),
  department: z.string().min(1, 'Department required'),
  phone: z.string().min(10, 'Valid phone required'),
})

type StaffFormData = z.infer<typeof staffSchema>

const mockStaff = [
  {
    id: '1',
    name: 'Mrs. Sharma',
    email: 'sharma@disha.local',
    role: 'Teacher',
    department: 'Mathematics',
    phone: '9876543210',
    classes: ['10-A', '11-B'],
    experience: '8 years',
    qualification: 'M.Sc. Mathematics',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Mr. Patel',
    email: 'patel@disha.local',
    role: 'Teacher',
    department: 'Science',
    phone: '9876543211',
    classes: ['10-B', '11-A'],
    experience: '12 years',
    qualification: 'B.Sc. Physics',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Dr. Gupta',
    email: 'gupta@disha.local',
    role: 'Principal',
    department: 'Administration',
    phone: '9876543212',
    classes: [],
    experience: '20 years',
    qualification: 'Ph.D. Education',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Mrs. Khan',
    email: 'khan@disha.local',
    role: 'Vice Principal',
    department: 'Administration',
    phone: '9876543213',
    classes: ['11-A'],
    experience: '15 years',
    qualification: 'M.Ed',
    status: 'Active',
  },
  {
    id: '5',
    name: 'Mr. Singh',
    email: 'singh@disha.local',
    role: 'Librarian',
    department: 'Library',
    phone: '9876543214',
    classes: [],
    experience: '5 years',
    qualification: 'B.Lib Science',
    status: 'Active',
  },
]

export default function StaffPage() {
  const [staff, setStaff] = useState(mockStaff)
  const [showForm, setShowForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<typeof mockStaff[0] | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('All')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  })

  const filteredStaff = staff.filter((member) =>
    (filterRole === 'All' || member.role === filterRole) &&
    (member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()))
  )

  const onSubmit = (data: StaffFormData) => {
    setStaff([
      ...staff,
      {
        id: Date.now().toString(),
        ...data,
        classes: [],
        experience: '0 years',
        qualification: '',
        status: 'Active',
      },
    ])
    reset()
    setShowForm(false)
  }

  const roles = ['All', 'Teacher', 'Principal', 'Vice Principal', 'Librarian', 'Administrator']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">Manage teachers and staff members</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="email@disha.local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Administrator">Administrator</option>
                </select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  {...register('department')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Administration">Administration</option>
                  <option value="Library">Library</option>
                </select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="10-digit phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Staff Member
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === 'All' ? 'All Roles' : role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{member.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.role}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.department}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {member.status}
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
            ))}
          </tbody>
        </table>
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStaff.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedStaff.role} • {selectedStaff.department}</p>
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
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900 mt-1">{selectedStaff.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900 mt-1">{selectedStaff.phone}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Qualification</p>
                  <p className="font-semibold text-gray-900 mt-1">{selectedStaff.qualification}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-semibold text-gray-900 mt-1">{selectedStaff.experience}</p>
                </div>
              </div>

              {selectedStaff.classes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Classes Assigned</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStaff.classes.map((cls) => (
                      <span
                        key={cls}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-medium text-sm"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                  Edit Details
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
                  Assign Classes
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
