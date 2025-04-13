import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// API-метод для обновления статуса возврата
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const returnId = params.id
    const { status, comment } = await request.json()
    
    // Проверка наличия статуса
    if (!status) {
      return NextResponse.json(
        { error: 'Статус не указан' },
        { status: 400 }
      )
    }
    
    // Проверка корректности статуса
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'processing']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус' },
        { status: 400 }
      )
    }
    
    // Сначала проверим существование записи
    const { data: existingReturn, error: fetchError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single()
      
    if (fetchError) {
      console.error('Ошибка при проверке существования возврата:', fetchError)
      return NextResponse.json(
        { error: 'Возврат не найден или ошибка доступа к базе данных' },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      )
    }
    
    // Подготовка данных для обновления
    const updateData: Record<string, any> = { 
      status,
      updated_at: new Date().toISOString() 
    }
    
    // Если передан комментарий администратора, добавляем его к описанию
    if (comment) {
      const existingDescription = existingReturn.description || ''
      updateData.description = `${existingDescription}\n\nКомментарий администратора (${new Date().toLocaleString()}):\n${comment}`
    }
    
    // Обновление статуса в базе данных
    const { data, error } = await supabase
      .from('returns')
      .update(updateData)
      .eq('id', returnId)
      .select()
    
    if (error) {
      console.error('Ошибка при обновлении статуса возврата:', error)
      return NextResponse.json(
        { error: 'Ошибка при обновлении статуса возврата' },
        { status: 500 }
      )
    }
    
    // В случае подтверждения или отклонения возврата можно добавить дополнительную логику
    // Например, отправку уведомления клиенту, обновление статистики и т.д.
    if (status === 'approved') {
      // Здесь можно добавить логику для одобренных возвратов
      console.log('Возврат одобрен:', returnId)
    } else if (status === 'rejected') {
      // Здесь можно добавить логику для отклоненных возвратов
      console.log('Возврат отклонен:', returnId)
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// API-метод для получения информации о возврате
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const returnId = params.id
    
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Возврат не найден' },
          { status: 404 }
        )
      }
      
      console.error('Ошибка при получении данных о возврате:', error)
      return NextResponse.json(
        { error: 'Ошибка при получении данных о возврате' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 