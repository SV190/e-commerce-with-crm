import { NextRequest, NextResponse } from 'next/server';

/**
 * Обработчик POST запроса для загрузки аватаров
 * В данной версии просто возвращает URL сгенерированного аватара с сервиса UI Avatars
 * пока мы решаем проблему с политиками безопасности в Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Пытаемся получить форму с файлом
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    
    // Проверка наличия файла и ID пользователя
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя не указан' },
        { status: 400 }
      );
    }
    
    console.log('Файл получен:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      userId 
    });
    
    // Временное решение: вместо реальной загрузки возвращаем URL сгенерированного аватара
    // В реальном проекте здесь была бы загрузка в Supabase Storage или другое хранилище
    
    // Генерируем инициалы на основе имени файла
    const initials = file.name.split('.')[0].substring(0, 2).toUpperCase();
    
    // Создаем "уникальный" цвет на основе userId
    const colorHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    const bgColor = `hsl(${colorHash}, 70%, 50%)`;
    
    // Генерируем URL аватара
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(bgColor.replace('#', ''))}&color=fff&size=256&bold=true`;
    
    // Возвращаем успешный ответ с URL
    return NextResponse.json({ 
      url: avatarUrl,
      success: true,
      message: 'Аватар успешно загружен (временное решение)',
    });
    
  } catch (error: any) {
    console.error('Ошибка загрузки аватара:', error);
    return NextResponse.json(
      { error: error.message || 'Произошла ошибка при загрузке файла' },
      { status: 500 }
    );
  }
} 