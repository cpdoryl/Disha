'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore, type User } from '@/lib/store/authStore'

interface NavbarProps {
  user: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
