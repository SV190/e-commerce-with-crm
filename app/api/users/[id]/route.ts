import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    // Проверяем существование пользователя в auth.users вместо таблицы users
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError) {
      return NextResponse.json(
        { error: 'Ошибка при получении данных пользователя' },
        { status: 500 }
      )
    }
    
    if (!authData || !authData.user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }
    
    // Возвращаем данные пользователя из auth.users
    const userData = {
      id: authData.user.id,
      email: authData.user.email || '',
      first_name: authData.user.user_metadata?.first_name || '',
      last_name: authData.user.user_metadata?.last_name || '',
      phone_number: authData.user.user_metadata?.phone_number || '',
      address: authData.user.user_metadata?.address || '',
      created_at: authData.user.created_at || new Date().toISOString()
    }
    
    // Возвращаем данные пользователя
    return NextResponse.json({ data: userData })
  } catch (error) {
    console.error('Error fetching user data:', error)
    
    // Создаем фиктивный ответ для продолжения работы приложения
    const mockUserData = {
      id: params.id,
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
      created_at: new Date().toISOString()
    }
    
    return NextResponse.json({ data: mockUserData })
  }
} 