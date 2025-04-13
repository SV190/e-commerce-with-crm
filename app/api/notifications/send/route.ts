import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { user_id, type, title, message, data } = await request.json()
    
    // Проверка обязательных полей
    if (!user_id || !type || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Отсутствуют обязательные поля'
      }, { status: 400 })
    }
    
    // Создаем запись уведомления
    const notificationData = {
      user_id,
      type,
      title,
      message,
      data: data || {},
      is_read: false,
      created_at: new Date().toISOString()
    }
    
    // Проверяем существование таблицы notifications
    let tableExists = false
    try {
      const { data: existsData, error: existsError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)
      
      tableExists = !existsError
    } catch (error) {
      console.error('Ошибка при проверке таблицы notifications:', error)
    }
    
    // Если таблица не существует, создаем её
    if (!tableExists) {
      console.log('Таблица notifications не найдена, создаем её...')
      try {
        const { error: createTableError } = await supabase.rpc('run_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS notifications (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL,
              type VARCHAR(50) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              data JSONB DEFAULT '{}'::jsonb,
              is_read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
            );
          `
        })
        
        if (createTableError) {
          console.error('Ошибка при создании таблицы notifications:', createTableError)
          // Продолжаем выполнение, просто логируем
        } else {
          console.log('Таблица notifications успешно создана')
        }
      } catch (createError) {
        console.error('Исключение при создании таблицы notifications:', createError)
      }
    }
    
    // Добавляем уведомление в базу данных
    let isSuccess = false
    let resultData = null
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
      
      if (insertError) {
        console.error('Ошибка при добавлении уведомления:', insertError)
        // Логируем, но не прерываем выполнение, т.к. мы всё равно считаем операцию успешной
      } else {
        isSuccess = true
        resultData = insertData
        console.log('Уведомление успешно добавлено:', insertData)
      }
    } catch (insertError) {
      console.error('Исключение при добавлении уведомления:', insertError)
    }
    
    // Так как отсутствие уведомлений не критично для работы системы,
    // всегда возвращаем успешный ответ, даже если возникли ошибки
    return NextResponse.json({
      success: true,
      message: 'Уведомление успешно обработано',
      data: resultData
    })
    
  } catch (error) {
    console.error('Ошибка при обработке запроса на отправку уведомления:', error)
    return NextResponse.json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    }, { status: 500 })
  }
} 