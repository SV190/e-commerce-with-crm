import { Product } from "@/types/supabase"
import { supabase } from "@/lib/supabase"

export interface CartItem {
  id: string
  name: string
  price: number
  oldPrice?: number
  quantity: number
  image?: string
  category?: string
}

type Cart = { [key: string]: number }

const CART_STORAGE_KEY = 'shopping_cart'
const USE_API_STORAGE = process.env.NEXT_PUBLIC_USE_API_STORAGE === 'true' || false

// Создаем функцию-обертку для проверки доступности localStorage
const getLocalStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage;
    }
    return null;
  } catch (e) {
    console.error('Ошибка доступа к localStorage:', e);
    return null;
  }
};

// Кэш для корзины, чтобы избежать постоянного чтения из localStorage
let cartCache: Cart | null = null;

// Сбрасываем кэш при загрузке страницы, чтобы всегда получать актуальные данные
if (typeof window !== 'undefined') {
  // Сбрасываем кэш при загрузке страницы
  window.addEventListener('load', () => {
    cartCache = null;
  });
  
  // Сбрасываем кэш при переходе на страницу (вкладка становится активной)
  window.addEventListener('focus', () => {
    cartCache = null;
  });
}

export const cartService = {
  getCart(): Cart {
    try {
      // В режиме разработки всегда читаем из localStorage, игнорируя кэш
      if (process.env.NODE_ENV === 'development') {
        const localStorage = getLocalStorage();
        if (!localStorage) return {};
        
        const cart = localStorage.getItem(CART_STORAGE_KEY)
        return cart ? JSON.parse(cart) : {};
      }
      
      // Проверяем кэш сначала для быстрого доступа
      if (cartCache !== null) {
        return cartCache;
      }
      
      const localStorage = getLocalStorage();
      if (!localStorage) return {};
      
      // Пробуем получить корзину из localStorage
      const cart = localStorage.getItem(CART_STORAGE_KEY)
      const parsedCart = cart ? JSON.parse(cart) : {};
      
      // Сохраняем в кэш для будущих вызовов
      cartCache = parsedCart;
      
      return parsedCart;
    } catch (error) {
      console.error('Ошибка при получении корзины:', error);
      return {};
    }
  },

  async updateCart(cart: Cart) {
    try {
      // Обновляем кэш сразу для быстрого доступа
      cartCache = cart;
      
      const localStorage = getLocalStorage();
      if (!localStorage) return;
      
      // Сохраняем в localStorage для локального доступа
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
      
      // Отложенная синхронизация с Supabase для более быстрого отклика UI
      setTimeout(async () => {
        try {
          // Всегда сохраняем в Supabase, если пользователь залогинен
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await this.saveCartToCloud(user.id, cart)
          }
        } catch (error) {
          console.error('Ошибка получения пользователя:', error)
        }
      }, 0);
    } catch (error) {
      console.error('Ошибка при обновлении корзины:', error);
    }
  },

  async addToCart(productId: string, quantity: number = 1) {
    // Мгновенное обновление локальных данных
    const cart = this.getCart()
    cart[productId] = (cart[productId] || 0) + quantity
    
    // Обновляем кэш немедленно
    cartCache = cart;
    
    // Асинхронно обновляем хранилище
    this.updateCart(cart)
    
    return cart
  },

  async decreaseItem(productId: string) {
    const cart = this.getCart()
    if (cart[productId] > 1) {
      cart[productId]--
    } else {
      delete cart[productId]
    }
    await this.updateCart(cart)
    return cart
  },

  async removeFromCart(productId: string) {
    const cart = this.getCart()
    delete cart[productId]
    await this.updateCart(cart)
    return cart
  },

  async clearCart() {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(CART_STORAGE_KEY)
    
    // Если включено API хранилище и пользователь залогинен, очищаем корзину в Supabase
    if (USE_API_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          const { error } = await supabase
            .from('user_carts')
            .update({ cart_data: {} })
            .eq('user_id', user.id)
          
          if (error) {
            if (error.code === '42P01') {
              console.warn('Таблица user_carts не существует. Работаем в режиме имитации.')
            } else {
              console.error('Ошибка очистки корзины:', error)
            }
          }
        } catch (error) {
          console.error('Ошибка синхронизации при очистке корзины:', error)
        }
      }
    }
  },
  
  // Создаем таблицу для корзин, если она еще не существует, без использования RPC
  async createCartsTable(): Promise<boolean> {
    if (!USE_API_STORAGE) return false
    
    try {
      // Проверим существование таблицы простым запросом
      const { error: checkError } = await supabase
        .from('user_carts')
        .select('id')
        .limit(1)
      
      // Если таблица не существует, возвращаем false
      if (checkError && checkError.code === '42P01') { // код ошибки для "relation does not exist"
        console.warn('Таблица user_carts не существует в базе данных')
        return false
      }
      
      return !checkError
    } catch (error) {
      console.error('Ошибка при проверке таблицы корзин:', error)
      return false
    }
  },
  
  // Инициализируем хранилище для корзины
  async initializeCartStorage(): Promise<boolean> {
    if (!USE_API_STORAGE) return false
    
    try {
      const tableExists = await this.createCartsTable()
      return tableExists
    } catch (error) {
      console.error('Ошибка при инициализации хранилища корзины:', error)
      return false
    }
  },
  
  // Загружаем корзину пользователя из Supabase
  async loadUserCart() {
    if (!USE_API_STORAGE) {
      return this.getCart()
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return this.getCart()
      
      try {
        // Проверяем соединение с Supabase
        try {
          const { error: testError } = await supabase.from('products').select('id').limit(1)
          if (testError && (testError.message?.includes('Failed to fetch') || testError.code === 'NETWORK_ERROR')) {
            console.warn('Проблема с подключением к Supabase. Используем локальное хранилище.')
            return this.getCart()
          }
        } catch (networkError) {
          console.warn('Сетевая ошибка при проверке соединения с Supabase:', networkError)
          return this.getCart()
        }
        
        // Проверяем доступность таблицы
        const tableExists = await this.createCartsTable()
        if (!tableExists) {
          return this.getCart()
        }
        
        const { data, error } = await supabase
          .from('user_carts')
          .select('cart_data')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Корзина не найдена, создаем новую запись
            const localCart = this.getCart()
            await this.saveCartToCloud(user.id, localCart)
            return localCart
          } else if (error.code === '42P01') {
            console.warn('Таблица user_carts не существует. Создаем таблицу.')
            await this.createCartsTable()
            const localCart = this.getCart()
            await this.saveCartToCloud(user.id, localCart)
            return localCart
          } else if (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR') {
            console.warn('Сетевая ошибка при загрузке корзины. Используем локальное хранилище.')
            return this.getCart()
          }
          console.error('Ошибка загрузки корзины пользователя:', error)
          return this.getCart()
        }
        
        if (data && data.cart_data) {
          // Обновляем localStorage с данными из Supabase
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.cart_data))
          return data.cart_data
        }
        
        return this.getCart()
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.code === 'NETWORK_ERROR') {
          console.warn('Сетевая ошибка при загрузке корзины:', error)
        } else {
          console.error('Ошибка загрузки корзины:', error)
        }
        return this.getCart()
      }
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'NETWORK_ERROR') {
        console.warn('Сетевая ошибка при получении данных пользователя:', error)
      } else {
        console.error('Ошибка получения данных пользователя:', error)
      }
      return this.getCart()
    }
  },

  async syncCartWithCloud(userId: string): Promise<void> {
    if (!USE_API_STORAGE) {
      return
    }
    
    try {
      // Проверяем доступность таблицы
      const tableExists = await this.createCartsTable()
      if (!tableExists) {
        return
      }
      
      const { data, error } = await supabase
        .from('user_carts')
        .select('cart_data')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Корзина не найдена, создаем новую запись
          const localCart = this.getCart()
          await this.saveCartToCloud(userId, localCart)
        } else if (error.code === '42P01') {
          // Таблица не существует, создаем ее
          await this.createCartsTable()
          const localCart = this.getCart()
          await this.saveCartToCloud(userId, localCart)
        } else {
          console.error('Ошибка при загрузке корзины:', error);
        }
        return;
      }
      
      if (data && data.cart_data) {
        // Обновляем локальную корзину данными из облака
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.cart_data));
      }
    } catch (error) {
      console.error('Ошибка при синхронизации корзины:', error);
    }
  },

  async saveCartToCloud(userId: string, cartItems: Cart): Promise<boolean> {
    if (!USE_API_STORAGE) {
      return false
    }
    
    try {
      // Проверяем доступность таблицы
      const tableExists = await this.createCartsTable()
      if (!tableExists) {
        return false
      }
      
      const { error } = await supabase
        .from('user_carts')
        .upsert(
          { 
            user_id: userId, 
            cart_data: cartItems,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );
      
      if (error) {
        if (error.code === '42P01') {
          // Таблица не существует, создаем ее
          await this.createCartsTable();
          // Повторяем запрос
          return await this.saveCartToCloud(userId, cartItems);
        } else {
          console.error('Ошибка при сохранении корзины в облако:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении корзины:', error);
      return false;
    }
  },

  // Очищаем кэш при изменении корзины извне (например, через другую вкладку)
  clearCache() {
    cartCache = null;
  }
}

// Экспортируем cartService по умолчанию для совместимости с существующими импортами
export default cartService;

// Если мы в браузере, добавим слушатель на изменения localStorage для обновления кэша
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === CART_STORAGE_KEY) {
      cartCache = null; // Сбрасываем кэш при изменении корзины в другой вкладке
    }
  });
  
  // Инициализируем хранилище корзины при загрузке скрипта
  setTimeout(() => {
    try {
      cartService.initializeCartStorage().catch(error => {
        console.error('Ошибка инициализации корзины:', error);
      });
    } catch (e) {
      console.error('Критическая ошибка при инициализации корзины:', e);
    }
  }, 1000);
}