import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware для защиты API-маршрутов, требующих авторизации
 */
export async function withAuth(request: Request, handler: (req: Request) => Promise<NextResponse>) {
  console.log('Проверка авторизации для API-запроса')
  
  // Получаем cookie из запроса
  const cookieStore = cookies()
  
  // Создаем клиент Supabase для проверки токена
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  // Проверяем сессию пользователя
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.log('Сессия не найдена, доступ запрещен')
    return new NextResponse(
      JSON.stringify({ error: 'Требуется авторизация' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  const userId = session.user.id
  console.log(`Пользователь авторизован: ${userId}`)
  
  // Разрешаем доступ авторизованному пользователю
  return handler(request)
}

// Для обратной совместимости
export const withAdminAuth = withAuth; 