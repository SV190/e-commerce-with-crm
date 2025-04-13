'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { cartService } from '@/services/cartService'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

const USE_API_STORAGE = process.env.NEXT_PUBLIC_USE_API_STORAGE === 'true'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Синхронизируем корзину и избранное при смене аутентификации
  const synchronizeUserData = async (newUser: User | null) => {
    try {
      if (newUser && USE_API_STORAGE) {
        // Проверка соединения с Supabase
        let connectionOk = true
        try {
          await supabase.from('products').select('id').limit(1).single()
        } catch (error) {
          console.warn('Проблема с подключением к Supabase при синхронизации данных пользователя.')
          console.warn('Синхронизация данных отключена. Используется локальное хранилище.')
          connectionOk = false
        }
        
        if (!connectionOk) return
        
        // Пользователь вошел в систему - загружаем его данные
        await cartService.loadUserCart()
        
        // Загружаем избранное
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('favorites_data')
            .eq('user_id', newUser.id)
            .single()
          
          if (error) {
            if (error.code === '42P01') {
              console.warn('Таблица user_favorites не существует. Работаем в режиме имитации.')
            } else if (error.code !== 'PGRST116') {
              console.error('Error loading favorites:', error)
            }
          } else if (data && data.favorites_data) {
            // Объединяем с локальными данными избранного
            const localFavorites = localStorage.getItem('favorites')
            let favorites = data.favorites_data
            
            if (localFavorites) {
              try {
                const parsedLocal = JSON.parse(localFavorites)
                favorites = { ...parsedLocal, ...favorites }
              } catch (e) {
                console.error('Error parsing local favorites:', e)
              }
            }
            
            // Обновляем localStorage
            localStorage.setItem('favorites', JSON.stringify(favorites))
          }
        } catch (e) {
          console.error('Error loading favorites:', e)
        }
      }
    } catch (e) {
      console.error('Error synchronizing user data:', e)
    }
  }

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      synchronizeUserData(currentUser).then(() => setLoading(false))
    })

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      await synchronizeUserData(currentUser)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 