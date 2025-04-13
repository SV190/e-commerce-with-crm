'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut()
      } catch (error) {
        console.error('Ошибка при выходе из системы:', error)
      } finally {
        router.push('/auth/login')
      }
    }

    performLogout()
  }, [signOut, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Выход из системы...</h2>
        <p className="mt-2 text-gray-500">Пожалуйста, подождите</p>
      </div>
    </div>
  )
} 