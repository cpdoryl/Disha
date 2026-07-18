'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white text-3xl font-bold">D</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Disha</h1>
            <p className="text-gray-600">Education Management System</p>
          </div>
          <LoginForm />
          <div className="mt-8 text-center border-t pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Don't have an account?
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to Home
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Disha by Ryl Neuro Academy. All rights reserved.
        </p>
      </div>
    </div>
  )
}
