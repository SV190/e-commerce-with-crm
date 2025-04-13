'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle, Mail, Lock, User, Home } from 'lucide-react'

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  })
  const { signIn } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              address: formData.address
            }
          }
        })
        
        if (signUpError) throw signUpError

        if (data.user) {
          setSuccess('Регистрация успешна! Теперь вы можете войти в систему.')
          setIsRegistering(false)
          // Очищаем форму
          setFormData({
            ...formData,
            password: ''
          })
        }
      } else {
        await signIn(formData.email, formData.password)
        router.push('/')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(
        error.message === 'Invalid login credentials'
          ? 'Неверный логин или пароль'
          : error.message || 'Произошла ошибка при авторизации'
      )
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) return false
    if (isRegistering && (!formData.firstName || !formData.lastName)) return false
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Лабудин Склад</h1>
          <p className="mt-2 text-gray-600">Система управления складом и электронной коммерции</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {isRegistering ? 'Регистрация' : 'Вход в систему'}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegistering 
                ? 'Создайте новую учетную запись для доступа к системе' 
                : 'Войдите, используя свои учетные данные'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Электронная почта"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {isRegistering && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="firstName"
                          placeholder="Имя"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="lastName"
                          placeholder="Фамилия"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Home className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="address"
                        placeholder="Адрес"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || !validateForm()}
              >
                {loading 
                  ? 'Загрузка...' 
                  : isRegistering 
                    ? 'Зарегистрироваться' 
                    : 'Войти'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setError('')
                setSuccess('')
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isRegistering
                ? 'Уже есть аккаунт? Войти'
                : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          Разработано командой ПрофИТ &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
} 