'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  userRole: string
}

// Keys must match User.userType values exactly (school_admin, teacher,
// parent, student, ryl_admin, ryl_support — see ADMIN_GUIDE.md /
// USER_GUIDES.md). This used to have a key literally named "admin", which
// no real role value has ever matched — a ryl_admin login silently fell
// through to the `student` menu below (the `|| menuItems.student`
// fallback), which itself linked to /dashboard/courses and
// /dashboard/performance, neither of which exists as a page. Every link
// here has been verified against an actual file under
// frontend/app/dashboard/ — see ADMIN_GUIDE.md and USER_GUIDES.md for
// which roles have genuinely working navigation today and which don't.
const menuItems = {
  ryl_admin: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
  ],
  ryl_support: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
  ],
  school_admin: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Students', href: '/dashboard/students', icon: '👨‍🎓' },
    { name: 'Staff', href: '/dashboard/staff', icon: '👨‍🏫' },
    { name: 'Attendance', href: '/dashboard/attendance', icon: '📝' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
  ],
  teacher: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Classes', href: '/dashboard/classes', icon: '📚' },
    { name: 'Students', href: '/dashboard/students', icon: '👨‍🎓' },
    { name: 'Assessments', href: '/dashboard/assessments', icon: '✏️' },
    { name: 'Attendance', href: '/dashboard/attendance', icon: '📝' },
  ],
  student: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Assessments', href: '/dashboard/assessments', icon: '✏️' },
    { name: 'Attendance', href: '/dashboard/attendance', icon: '📝' },
  ],
  parent: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Attendance', href: '/dashboard/attendance', icon: '📝' },
    { name: 'Communications', href: '/dashboard/communications', icon: '💬' },
  ],
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const items = menuItems[userRole as keyof typeof menuItems] || [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Disha</h1>
        <p className="text-gray-400 text-sm">v2.0</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <p className="text-xs text-gray-500">© 2026 Disha</p>
      </div>
    </aside>
  )
}
