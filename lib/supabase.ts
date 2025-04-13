import { createClient } from '@supabase/supabase-js'

// Определяем URL и анонимный ключ для Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Проверка конфигурации
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('ВНИМАНИЕ: Отсутствуют переменные окружения для Supabase. Проверьте файл .env.local')
}

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Проверка соединения с Supabase
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('products').select('id').limit(1)
    
    // Проверяем, есть ли ответ от сервера
    if (error) {
      if (error.code === 'PGRST116') {
        // Таблица не найдена, но соединение работает
        console.log('Соединение с Supabase установлено, но таблица products не найдена')
        return { connected: true, error: null }
      } else {
        console.error('Ошибка соединения с Supabase:', error)
        return { connected: false, error }
      }
    }
    
    console.log('Соединение с Supabase установлено успешно')
    return { connected: true, error: null }
  } catch (error) {
    console.error('Критическая ошибка соединения с Supabase:', error)
    return { connected: false, error }
  }
}

// Проверка существования таблиц
export async function checkTablesExist() {
  console.log('Проверка существования таблиц в базе данных...')
  
  // Проверяем соединение прежде всего
  const connection = await checkSupabaseConnection()
  if (!connection.connected) {
    console.error('Невозможно проверить таблицы: нет соединения с Supabase')
    return false
  }
  
  // Проверяем таблицу корзин
  const { error: cartsError } = await supabase
    .from('user_carts')
    .select('id')
    .limit(1)
  
  if (cartsError) {
    if (cartsError.code === 'PGRST116') {
      console.warn('Таблица user_carts не найдена')
    } else {
      console.error('Ошибка при проверке таблицы user_carts:', cartsError)
    }
  } else {
    console.log('Таблица user_carts существует')
  }
  
  // Проверяем таблицу избранного
  const { error: favoritesError } = await supabase
    .from('user_favorites')
    .select('id')
    .limit(1)
  
  if (favoritesError) {
    if (favoritesError.code === 'PGRST116') {
      console.warn('Таблица user_favorites не найдена')
    } else {
      console.error('Ошибка при проверке таблицы user_favorites:', favoritesError)
    }
  } else {
    console.log('Таблица user_favorites существует')
  }
  
  // Проверяем таблицу заказов
  const { error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .limit(1)
  
  if (ordersError) {
    if (ordersError.code === 'PGRST116') {
      console.warn('Таблица orders не найдена')
    } else {
      console.error('Ошибка при проверке таблицы orders:', ordersError)
    }
  } else {
    console.log('Таблица orders существует')
  }
  
  // Проверяем таблицу элементов заказа
  const { error: orderItemsError } = await supabase
    .from('order_items')
    .select('id')
    .limit(1)
  
  if (orderItemsError) {
    if (orderItemsError.code === 'PGRST116') {
      console.warn('Таблица order_items не найдена')
    } else {
      console.error('Ошибка при проверке таблицы order_items:', orderItemsError)
    }
  } else {
    console.log('Таблица order_items существует')
  }
  
  return !(cartsError || favoritesError || ordersError || orderItemsError)
} 