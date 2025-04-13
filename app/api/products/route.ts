import { NextResponse } from 'next/server'
import { databaseService } from '@/services/database'

// Получить все товары
export async function GET(request: Request) {
  try {
    // Проверяем параметр article в URL
    const url = new URL(request.url)
    const article = url.searchParams.get('article')
    
    if (article) {
      // Если указан артикул, ищем товар по нему
      const product = await databaseService.getProductByArticle(article)
      
      if (!product) {
        return NextResponse.json(
          { error: 'Товар с указанным артикулом не найден' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(product)
    }
    
    // Если артикул не указан, возвращаем все товары
    const products = await databaseService.getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении товаров' },
      { status: 500 }
    )
  }
} 