'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import LoginForm from '@/components/auth/LoginForm'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Disha</h1>
            <p className="text-gray-600">Education Management System</p>
          </div>
          <LoginForm />
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 Disha. All rights reserved.
        </p>
      </div>
    </div>
  )
}
