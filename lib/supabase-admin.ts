import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)

// SQL запросы для создания таблиц
const CREATE_USER_CARTS_TABLE = `
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    cart_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Включаем Row Level Security
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для корзины
CREATE POLICY "Пользователи могут читать только свою корзину" ON user_carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свою корзину" ON user_carts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут вставлять только свою корзину" ON user_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
`

const CREATE_USER_FAVORITES_TABLE = `
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    favorites_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Включаем Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для избранного
CREATE POLICY "Пользователи могут читать только свое избранное" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свое избранное" ON user_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут вставлять только свое избранное" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);
`

const CREATE_ORDERS_TABLE = `
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'canceled', 'cancelled')),
    address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    delivery_option TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Включаем Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для заказов
CREATE POLICY "Пользователи могут читать только свои заказы" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут вставлять только свои заказы" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свои заказы" ON orders
    FOR UPDATE USING (auth.uid() = user_id);
`

const CREATE_ORDER_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Включаем Row Level Security
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для элементов заказа
CREATE POLICY "Пользователи могут читать элементы своих заказов" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Пользователи могут вставлять элементы в свои заказы" ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );
`

// Создание триггера для обновления updated_at
const CREATE_UPDATED_AT_TRIGGER = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_user_carts_updated_at
BEFORE UPDATE ON user_carts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_favorites_updated_at
BEFORE UPDATE ON user_favorites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`

// Функция для прямого создания таблиц через SQL запросы
export async function createTables() {
  try {
    console.log('Начинаем создание таблиц...')
    
    // Сначала проверим доступность функции exec_sql
    const rpcStatus = await checkRPCAvailability()
    
    if (!rpcStatus.exec_sql) {
      console.warn('Функция exec_sql недоступна в Supabase, используем альтернативный метод создания таблиц.')
      await createTablesDirectly()
      return
    }
    
    // Если функция exec_sql доступна, продолжаем стандартный процесс
    
    // Проверка существования таблицы user_carts
    const { data: cartsExists, error: cartsCheckError } = await supabaseAdmin
      .from('user_carts')
      .select('id')
      .limit(1)
    
    if (cartsCheckError && cartsCheckError.code === 'PGRST116') {
      console.log('Таблица user_carts не существует, создаём SQL-запросом')
      
      try {
        // Создаем таблицу напрямую через SQL
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_statement: CREATE_USER_CARTS_TABLE
        })
        
        if (error) {
          console.error('Ошибка при создании таблицы user_carts:', error)
        } else {
          console.log('Таблица user_carts создана успешно')
        }
      } catch (e) {
        console.error('Критическая ошибка при создании таблицы user_carts:', e)
      }
    } else {
      console.log('Таблица user_carts уже существует')
    }
    
    // Проверка существования таблицы user_favorites
    const { data: favoritesExists, error: favoritesCheckError } = await supabaseAdmin
      .from('user_favorites')
      .select('id')
      .limit(1)
    
    if (favoritesCheckError && favoritesCheckError.code === 'PGRST116') {
      console.log('Таблица user_favorites не существует, создаём SQL-запросом')
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_statement: CREATE_USER_FAVORITES_TABLE
        })
        
        if (error) {
          console.error('Ошибка при создании таблицы user_favorites:', error)
        } else {
          console.log('Таблица user_favorites создана успешно')
        }
      } catch (e) {
        console.error('Критическая ошибка при создании таблицы user_favorites:', e)
      }
    } else {
      console.log('Таблица user_favorites уже существует')
    }
    
    // Проверка существования таблицы orders
    const { data: ordersExists, error: ordersCheckError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .limit(1)
    
    if (ordersCheckError && ordersCheckError.code === 'PGRST116') {
      console.log('Таблица orders не существует, создаём SQL-запросом')
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_statement: CREATE_ORDERS_TABLE
        })
        
        if (error) {
          console.error('Ошибка при создании таблицы orders:', error)
        } else {
          console.log('Таблица orders создана успешно')
        }
      } catch (e) {
        console.error('Критическая ошибка при создании таблицы orders:', e)
      }
    } else {
      console.log('Таблица orders уже существует')
    }
    
    // Проверка существования таблицы order_items
    const { data: orderItemsExists, error: orderItemsCheckError } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .limit(1)
    
    if (orderItemsCheckError && orderItemsCheckError.code === 'PGRST116') {
      console.log('Таблица order_items не существует, создаём SQL-запросом')
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_statement: CREATE_ORDER_ITEMS_TABLE
        })
        
        if (error) {
          console.error('Ошибка при создании таблицы order_items:', error)
        } else {
          console.log('Таблица order_items создана успешно')
        }
      } catch (e) {
        console.error('Критическая ошибка при создании таблицы order_items:', e)
      }
    } else {
      console.log('Таблица order_items уже существует')
    }
    
    // Создаем триггеры для обновления даты
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_statement: CREATE_UPDATED_AT_TRIGGER
      })
      
      if (error) {
        console.error('Ошибка при создании триггеров updated_at:', error)
      } else {
        console.log('Триггеры updated_at созданы успешно')
      }
    } catch (e) {
      console.error('Ошибка при создании триггеров updated_at:', e)
    }
    
    console.log('Проверка таблиц завершена')
  } catch (error) {
    console.error('Общая ошибка при создании таблиц:', error)
  }
}

// Создание таблиц через SQL-запросы в админ-панели Supabase
async function createTablesDirectly() {
  console.log('Пытаемся создать таблицы через SQL-запросы в Supabase...')
  console.log('Данная функция требует ручного выполнения SQL в админ-панели Supabase.')
  console.log('Пожалуйста, выполните следующие SQL-запросы в SQL Editor панели Supabase:')
  console.log('\n--- SQL для таблицы user_carts ---\n')
  console.log(CREATE_USER_CARTS_TABLE)
  console.log('\n--- SQL для таблицы user_favorites ---\n')
  console.log(CREATE_USER_FAVORITES_TABLE)
  console.log('\n--- SQL для таблицы orders ---\n')
  console.log(CREATE_ORDERS_TABLE)
  console.log('\n--- SQL для таблицы order_items ---\n')
  console.log(CREATE_ORDER_ITEMS_TABLE)
  console.log('\n--- SQL для создания триггеров ---\n')
  console.log(CREATE_UPDATED_AT_TRIGGER)
  console.log('\nПосле выполнения SQL-запросов перезапустите приложение.')
}

// Функция для проверки доступности RPC функций в Supabase
export async function checkRPCAvailability() {
  try {
    // Проверяем доступность функции exec_sql
    console.log('Проверка доступности RPC функции exec_sql...')
    
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_statement: 'SELECT 1 AS test'
      })
      
      if (error) {
        console.error('Функция exec_sql недоступна:', error)
        return {
          exec_sql: false,
          error: error
        }
      }
      
      console.log('Функция exec_sql доступна!')
      return {
        exec_sql: true,
        error: null
      }
    } catch (error: any) {
      // Обработка ошибки 404 - функция не найдена
      if (error?.status === 404 || 
          (error?.message && error.message.includes('404')) || 
          (error?.response && error.response.status === 404)) {
        console.warn('Функция exec_sql не найдена на сервере (404).')
        console.warn('Это нормально, если вы не настроили RPC функции в Supabase.')
        return {
          exec_sql: false,
          error: {
            message: 'Функция exec_sql не найдена на сервере',
            code: 'NOT_FOUND',
            status: 404
          }
        }
      }
      
      // Обработка сетевых ошибок
      if (error?.message?.includes('Failed to fetch') || 
          error?.code === 'NETWORK_ERROR' || 
          error?.name === 'TypeError') {
        console.error('Проблема с сетевым подключением к Supabase:', error)
        return {
          exec_sql: false,
          error: {
            message: 'Проблема с подключением к Supabase',
            details: error?.message || 'Неизвестная ошибка сети',
            code: 'NETWORK_ERROR'
          }
        }
      }
      
      console.error('Ошибка при проверке RPC функций:', error)
      return {
        exec_sql: false,
        error: error
      }
    }
  } catch (error) {
    console.error('Критическая ошибка при проверке RPC функций:', error)
    return {
      exec_sql: false,
      error: error
    }
  }
} 