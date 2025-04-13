import { NextResponse } from 'next/server'
import { databaseService } from '@/services/database'

export async function GET(request: Request) {
  try {
    // Добавить здесь проверку доступа администратора
    
    console.log('Запуск обновления структуры базы данных');
    
    // Запуск обновления структуры таблицы returns
    const result = await databaseService.fixReturnsTableStructure();
    
    return NextResponse.json({
      success: true,
      message: 'Структура базы данных обновлена',
      details: { returnsTable: result }
    });
  } catch (error) {
    console.error('Ошибка при обновлении структуры базы данных:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при обновлении структуры базы данных' },
      { status: 500 }
    );
  }
} 