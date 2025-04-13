'use client'

import React from 'react'
import { useAuth } from './AuthProvider'

export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  // Если загружаем данные пользователя, показываем лоадер
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }
  
  // Если пользователь не авторизован, отображаем страницу входа
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Требуется авторизация</h1>
          <p className="mb-6 text-center">
            Для доступа к этой странице необходимо войти в систему.
          </p>
          <a 
            href="/login" 
            className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
          >
            Войти в систему
          </a>
        </div>
      </div>
    )
  }
  
  // Разрешаем доступ любому авторизованному пользователю
  return <>{children}</>
} 