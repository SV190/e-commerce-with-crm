import { Defect, Return, Report, Product, Order, OrderItem } from '@/types/supabase'
import { supabase } from '@/lib/supabase'

// Возвращаем использование Supabase для хранения заказов
const USE_API_STORAGE = process.env.NEXT_PUBLIC_USE_API_STORAGE === 'true'

export const databaseService = {
  // Defects
  async createDefect(defect: Omit<Defect, 'id' | 'created_at' | 'user_id'>) {
    const { data, error } = await supabase
      .from('defects')
      .insert([defect])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getDefects() {
    const { data, error } = await supabase
      .from('defects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Returns
  async createReturn(returnItem: Omit<Return, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Преобразуем поле reason в return_reason для соответствия с DB
      const { reason, ...restData } = returnItem;
      const dataToInsert = {
        ...restData,
        return_reason: reason
      };
  
      // Вставляем данные и получаем сгенерированный ID
      const { data, error: insertError } = await supabase
        .from('returns')
        .insert([dataToInsert])
        .select('id')
        .single();
  
      if (insertError) throw insertError;
  
      if (!data || !data.id) {
        throw new Error('Failed to create return: no ID returned');
      }
      
      // Возвращаем созданный возврат с известным ID
      return {
        ...restData,
        reason,
        id: data.id,
        created_at: new Date().toISOString()
      } as Return;
    } catch (error) {
      console.error('Error creating return:', error);
      throw error;
    }
  },

  async getReturns() {
    try {
      // Используем параметр запроса для игнорирования кеша
      const timestamp = new Date().getTime();
      
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Глубокое копирование для создания нового объекта данных
      return JSON.parse(JSON.stringify(data || []));
    } catch (error) {
      console.error('Error getting returns:', error);
      return [];
    }
  },

  async getUserReturns(userId: string) {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Глубокое копирование для создания нового объекта данных
      return JSON.parse(JSON.stringify(data || []));
    } catch (error) {
      console.error('Error getting user returns:', error);
      return [];
    }
  },

  async uploadReturnImage(file: File, returnId: string) {
    try {
      console.log(`[uploadReturnImage] Начинаем загрузку файла для возврата ${returnId}`, file.name);
      
      // Пробуем просто сконвертировать изображение в base64 и использовать как URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            // Получаем данные в формате base64
            const base64data = reader.result as string;
            
            // Для небольших изображений просто используем base64 напрямую
            if (file.size < 500 * 1024) { // Меньше 500KB
              console.log(`[uploadReturnImage] Используем изображение как base64 URL, размер: ${(base64data.length / 1024).toFixed(2)}KB`);
              resolve(base64data);
              return;
            }
            
            // Для больших изображений используем placehold.co с именем файла
            console.log(`[uploadReturnImage] Изображение слишком большое для base64, размер: ${(file.size / 1024).toFixed(2)}KB`);
            const placeholderUrl = `https://placehold.co/400x400?text=${encodeURIComponent(file.name)}`;
            resolve(placeholderUrl);
          } catch (error) {
            console.error('[uploadReturnImage] Ошибка при обработке файла:', error);
            resolve("https://placehold.co/400x400?text=Ошибка+загрузки+фото");
          }
        };
        reader.onerror = () => {
          console.error('[uploadReturnImage] Ошибка при чтении файла');
          resolve("https://placehold.co/400x400?text=Ошибка+загрузки+фото");
        };
      });
    } catch (error) {
      console.error('[uploadReturnImage] Общая ошибка при загрузке:', error);
      // Возвращаем URL на реальное изображение-заглушку вместо несуществующего файла
      return "https://placehold.co/400x400?text=Ошибка+загрузки+фото";
    }
  },

  // Reports
  async createReport(report: Omit<Report, 'id' | 'created_at' | 'user_id'>) {
    const { data, error } = await supabase
      .from('reports')
      .insert([report])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Statistics
  async getDefectsStatistics() {
    const { data, error } = await supabase
      .from('defects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const total = data.length
    const thisMonth = data.filter(defect => {
      const date = new Date(defect.created_at)
      const now = new Date()
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear()
    }).length

    const average = data.reduce((acc, defect) => acc + defect.quantity, 0) / total

    return {
      total,
      thisMonth,
      average: Math.round(average)
    }
  },

  async getReturnsStatistics() {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const total = data.length
    const thisMonth = data.filter((returnItem: Return) => {
      const date = new Date(returnItem.created_at)
      const now = new Date()
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear()
    }).length

    const average = data.reduce((acc: number, returnItem: Return) => acc + returnItem.quantity, 0) / total

    return {
      total,
      thisMonth,
      average: Math.round(average)
    }
  },

  // Events
  async getRecentEvents(limit = 10) {
    try {
      const [defects, returns] = await Promise.all([
        this.getDefects(),
        this.getReturns()
      ])

      const events = [
        ...(defects || []).map(defect => ({
          id: defect.id,
          type: 'defect',
          title: `Брак: ${defect.product_name}`,
          description: `${defect.quantity} шт. - ${defect.defect_type}`,
          created_at: defect.created_at,
          status: defect.status
        })),
        ...(returns || []).map((returnItem: Return) => ({
          id: returnItem.id,
          type: 'return',
          title: `Возврат: ${returnItem.product_name}`,
          description: `${returnItem.quantity} шт. - ${returnItem.return_reason}`,
          created_at: returnItem.created_at,
          status: returnItem.status
        }))
      ]

      return events
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting recent events:', error)
      return []
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getProductByArticle(article: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('article', article)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 - код ошибки для "Результат не найден"
        return null
      }
      throw error
    }
    return data
  },

  async createProducts(products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select()

    if (error) throw error
    return data
  },
  
  // Orders
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, orderItems: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<Order> {
    if (!USE_API_STORAGE) {
      // Возвращаем имитацию успешного создания
      const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`
      return {
        ...order,
        id: orderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: orderItems.map((item, index) => ({
          ...item,
          id: `item_${Math.random().toString(36).substring(2, 10)}`,
          order_id: orderId
        }))
      }
    }
    
    try {
      // Начинаем транзакцию для создания заказа и его элементов
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single()

      if (orderError) {
        if (orderError.code === '42P01') {
          console.warn('Таблица orders не существует. Работаем в режиме имитации.')
          // Возвращаем имитацию успешного создания
          const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`
          return {
            ...order,
            id: orderId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: orderItems.map((item, index) => ({
              ...item,
              id: `item_${Math.random().toString(36).substring(2, 10)}`,
              order_id: orderId
            }))
          }
        }
        throw orderError
      }
      
      // Создаем элементы заказа с привязкой к созданному заказу
      const itemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: orderData.id
      }))
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId)
        .select()
      
      if (itemsError) {
        if (itemsError.code === '42P01') {
          console.warn('Таблица order_items не существует. Работаем в режиме имитации.')
          // Создаем имитацию элементов заказа
          return {
            ...orderData,
            items: itemsWithOrderId.map((item, index) => ({
              ...item,
              id: `item_${Math.random().toString(36).substring(2, 10)}`,
            }))
          }
        }
        throw itemsError
      }
      
      // Возвращаем созданный заказ с его элементами
      return {
        ...orderData,
        items: itemsData
      }
    } catch (error) {
      console.error('Ошибка при создании заказа:', error)
      throw error
    }
  },
  
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    if (!USE_API_STORAGE) {
      // Возвращаем пустой массив заказов в режиме имитации
      return []
    }
    
    try {
      // Попытка синхронизировать статусы заказов с CRM перед выдачей
      try {
        // Проверяем существование таблицы crm_orders
        const { data: crmData, error: crmError } = await supabase
          .from('crm_orders')
          .select('order_id, status, order_data')
          .order('updated_at', { ascending: false })
          
        if (!crmError && crmData && crmData.length > 0) {
          // Обходим все заказы из CRM и синхронизируем их статусы с основной таблицей
          for (const crmOrder of crmData) {
            let orderStatus: Order['status'] = 'pending'
            
            switch (crmOrder.status) {
              case 'confirmed':
                orderStatus = 'processing'
                break
              case 'shipped':
                orderStatus = 'shipped'
                break
              case 'delivered':
                orderStatus = 'delivered'
                break
              case 'cancelled':
                orderStatus = 'canceled'
                break
              default:
                continue // Пропускаем неизвестные статусы
            }
            
            // Обновляем статус в основной таблице
            await supabase
              .from('orders')
              .update({ 
                status: orderStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', crmOrder.order_id)
          }
        }
      } catch (syncError) {
        console.warn('Ошибка синхронизации статусов заказов с CRM:', syncError)
        // Продолжаем выполнение, даже если синхронизация не удалась
      }
      
      // Получаем заказы пользователя с элементами заказа
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Таблица orders не существует. Работаем в режиме имитации.')
          return []
        }
        throw error
      }
      
      // Преобразуем ответ Supabase в более удобный формат
      return data.map(order => ({
        ...order,
        items: order.order_items
      }))
    } catch (error) {
      console.error('Ошибка при получении заказов:', error)
      throw error
    }
  },
  
  async getOrderById(orderId: string): Promise<Order> {
    if (!USE_API_STORAGE) {
      throw new Error('Заказ не найден')
    }
    
    try {
      // Получаем конкретный заказ с его элементами
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .eq('id', orderId)
        .single()
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Таблица orders не существует. Работаем в режиме имитации.')
          throw new Error('Заказ не найден')
        }
        throw error
      }
      
      return {
        ...data,
        items: data.order_items
      }
    } catch (error) {
      console.error('Ошибка при получении заказа:', error)
      throw error
    }
  },
  
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    if (!USE_API_STORAGE) {
      console.log(`Имитация обновления статуса заказа ${orderId} на ${status}`)
      return
    }
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Таблица orders не существует. Работаем в режиме имитации.')
          return
        }
        throw error
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса заказа:', error)
      throw error
    }
  },
  
  async cancelOrder(orderId: string): Promise<void> {
    return this.updateOrderStatus(orderId, 'canceled')
  },

  // Финансовая статистика
  async getFinancialStatistics(period: 'day' | 'week' | 'month' | 'year' = 'month', isPreviousPeriod = false) {
    try {
      // Реальную статистику можно получить из Supabase
      // Но пока используем заглушку как пример
      // В реальном приложении здесь будет логика получения данных из БД
      
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      // Определяем временной интервал в зависимости от периода
      switch(period) {
        case 'day':
          if (isPreviousPeriod) {
            // Вчера
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setDate(now.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
          } else {
            // Сегодня
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
          }
          break;
        case 'week':
          if (isPreviousPeriod) {
            // Предыдущая неделя
            const dayOfWeek = now.getDay() || 7; // Преобразуем воскресенье (0) в 7
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek - 6); // Понедельник предыдущей недели
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setDate(now.getDate() - dayOfWeek); // Воскресенье предыдущей недели
            endDate.setHours(23, 59, 59, 999);
          } else {
            // Текущая неделя
            const dayOfWeek = now.getDay() || 7; // Преобразуем воскресенье (0) в 7
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dayOfWeek + 1); // Понедельник текущей недели
            startDate.setHours(0, 0, 0, 0);
          }
          break;
        case 'month':
          if (isPreviousPeriod) {
            // Предыдущий месяц
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Последний день предыдущего месяца
            endDate.setHours(23, 59, 59, 999);
          } else {
            // Текущий месяц
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          }
          break;
        case 'year':
          if (isPreviousPeriod) {
            // Предыдущий год
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          } else {
            // Текущий год
            startDate = new Date(now.getFullYear(), 0, 1);
          }
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      // Фильтрация по периоду
      const filterByPeriod = (date: string) => {
        const entryDate = new Date(date);
        return entryDate >= startDate && entryDate <= endDate;
      };
      
      // Получаем заказы для расчета доходов
      const orders = await this.getOrders();
      
      // Фильтруем по периоду
      const filteredOrders = orders.filter((order: Order) => filterByPeriod(order.created_at));
      
      // Считаем доход от заказов
      const income = filteredOrders.reduce((sum: number, order: Order) => {
        return sum + (order.total_amount || 0);
      }, 0);
      
      // Примерные данные для расходов
      // В реальном приложении эти данные могут быть получены из другой таблицы
      const expensesData = {
        logistics: Math.round(income * 0.15), // примерно 15% на логистику
        marketing: Math.round(income * 0.12), // примерно 12% на маркетинг
        salaries: Math.round(income * 0.2), // примерно 20% на зарплаты
        rent: Math.round(income * 0.08), // примерно 8% на аренду
      };
      
      // Общие расходы
      const totalExpenses = Object.values(expensesData).reduce((sum: number, value: number) => sum + value, 0);
      
      // Прибыль = доход - расходы
      const profit = income - totalExpenses;
      
      // Возвраты за период
      const returns = await this.getReturns();
      const filteredReturns = returns.filter((ret: Return) => filterByPeriod(ret.created_at));
      
      // Общая сумма возвратов (грубая оценка, так как у нас может не быть точной стоимости)
      const totalReturnsAmount = filteredReturns.reduce((sum: number, ret: Return) => {
        // В реальном приложении вы могли бы получить цену из связанного заказа
        // Здесь используем грубую оценку - средний чек * количество
        const avgOrderValue = filteredOrders.length > 0 ? income / filteredOrders.length : 0;
        return sum + (avgOrderValue * ret.quantity);
      }, 0);
      
      const periodName = isPreviousPeriod ? `previous-${period}` : period;
      
      return {
        period: periodName,
        income,
        expenses: {
          ...expensesData,
          total: totalExpenses
        },
        profit,
        returns: {
          count: filteredReturns.length,
          amount: totalReturnsAmount
        }
      };
    } catch (error) {
      console.error('Error calculating financial statistics:', error);
      
      // Возвращаем заглушку с нулевыми значениями
      const periodName = isPreviousPeriod ? `previous-${period}` : period;
      
      return {
        period: periodName,
        income: 0,
        expenses: {
          logistics: 0,
          marketing: 0,
          salaries: 0,
          rent: 0,
          total: 0
        },
        profit: 0,
        returns: {
          count: 0,
          amount: 0
        }
      };
    }
  },
  
  // Вспомогательный метод для расчета стоимости дефектов
  async calculateDefectsCost(defects: Defect[]) {
    // Получаем все продукты
    const products = await this.getProducts()
    
    return defects.reduce((sum, defect) => {
      // Находим продукт по названию (неточное совпадение)
      const product = products.find(product => 
        product.name.toLowerCase().includes(defect.product_name.toLowerCase()) ||
        defect.product_name.toLowerCase().includes(product.name.toLowerCase())
      )
      
      // Если нашли продукт, добавляем его стоимость * количество
      if (product) {
        return sum + (product.price * defect.quantity)
      }
      
      // Иначе используем среднюю стоимость продуктов * количество
      const avgPrice = products.length 
        ? products.reduce((sum, product) => sum + product.price, 0) / products.length 
        : 0
      
      return sum + (avgPrice * defect.quantity)
    }, 0)
  },
  
  // Получить все заказы
  async getOrders(): Promise<Order[]> {
    if (!USE_API_STORAGE) {
      return []
    }
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Таблица orders не существует. Работаем в режиме имитации.')
          return []
        }
        throw error
      }
      
      return data.map(order => ({
        ...order,
        items: order.order_items
      }))
    } catch (error) {
      console.error('Ошибка при получении заказов:', error)
      return []
    }
  },

  async updateReturnStatus(returnId: string, status: Return['status']) {
    const { data, error } = await supabase
      .from('returns')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', returnId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getReturnById(returnId: string): Promise<Return | null> {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('id', returnId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Возврат не найден
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error getting return with ID ${returnId}:`, error);
      return null;
    }
  },

  async updateReturnWithImages(returnId: string, imageUrls: string[]) {
    try {
      console.log(`[updateReturnWithImages] Обновление возврата ${returnId} с ${imageUrls.length} изображениями`);
      console.log(`[updateReturnWithImages] URLs изображений:`, imageUrls);
      
      if (!imageUrls || imageUrls.length === 0) {
        console.log(`[updateReturnWithImages] Нет изображений для сохранения`);
        return;
      }
      
      // Сначала получаем текущий возврат, чтобы проверить, есть ли уже у него изображения
      const { data: currentReturn, error: fetchError } = await supabase
        .from('returns')
        .select('images')
        .eq('id', returnId)
        .single();
      
      if (fetchError) {
        console.error(`[updateReturnWithImages] Ошибка при получении текущего возврата:`, fetchError);
        throw fetchError;
      }
      
      console.log(`[updateReturnWithImages] Текущие данные возврата:`, currentReturn);
      
      // Сохраняем пути к изображениям в виде JSON массива
      const { data, error } = await supabase
        .from('returns')
        .update({ 
          images: imageUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId)
        .select();
      
      if (error) {
        console.error(`[updateReturnWithImages] Ошибка при обновлении возврата:`, error);
        throw error;
      }
      
      console.log(`[updateReturnWithImages] Возврат успешно обновлен:`, data);
      return true;
    } catch (error) {
      console.error(`[updateReturnWithImages] Ошибка:`, error);
      return false;
    }
  },

  async fixReturnsTableStructure() {
    try {
      console.log('[fixReturnsTableStructure] Начинаем обновление структуры таблицы returns');
      
      // Проверяем существование колонки images
      const { data: hasImagesColumn, error: columnCheckError } = await supabase.rpc(
        'has_column',
        { table_name: 'returns', column_name: 'images' }
      );
      
      if (columnCheckError) {
        console.error('[fixReturnsTableStructure] Ошибка при проверке колонки:', columnCheckError);
        
        // Создаем RPC функцию для проверки существования колонки
        await supabase.rpc('create_has_column_function');
        
        // Пробуем проверку снова
        const { data: hasImagesColumnRetry } = await supabase.rpc(
          'has_column',
          { table_name: 'returns', column_name: 'images' }
        );
        
        console.log('[fixReturnsTableStructure] Результат повторной проверки:', hasImagesColumnRetry);
      } else {
        console.log('[fixReturnsTableStructure] Результат проверки колонки images:', hasImagesColumn);
      }
      
      // Выполняем прямой SQL-запрос для добавления колонки images, если её нет
      const { error: sqlError } = await supabase.rpc('run_sql', {
        sql: `
          DO $$
          BEGIN
            BEGIN
              ALTER TABLE returns ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
              RAISE NOTICE 'Column images added or already exists';
            EXCEPTION
              WHEN others THEN
                RAISE NOTICE 'Error adding column: %', SQLERRM;
            END;
          END $$;
        `
      });
      
      if (sqlError) {
        console.error('[fixReturnsTableStructure] Ошибка при выполнении SQL-запроса:', sqlError);
        
        // Создаем RPC функцию для выполнения SQL
        await supabase.rpc('create_run_sql_function');
        
        // Пробуем выполнить запрос снова
        const { error: sqlErrorRetry } = await supabase.rpc('run_sql', {
          sql: `ALTER TABLE returns ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;`
        });
        
        if (sqlErrorRetry) {
          console.error('[fixReturnsTableStructure] Ошибка при повторном выполнении SQL-запроса:', sqlErrorRetry);
        } else {
          console.log('[fixReturnsTableStructure] SQL-запрос выполнен успешно при повторной попытке');
        }
      } else {
        console.log('[fixReturnsTableStructure] SQL-запрос выполнен успешно');
      }
      
      return true;
    } catch (error) {
      console.error('[fixReturnsTableStructure] Общая ошибка:', error);
      return false;
    }
  },

  // Статистика заказов - используем реальные данные вместо заглушки
  async getOrdersStats() {
    try {
      // Получаем все заказы
      const orders = await this.getOrders();
      
      // Получаем заказы в обработке 
      const processingOrders = orders.filter((order: Order) => 
        order.status === 'pending' || order.status === 'processing'
      ).length;
      
      // Новые заказы - созданные за последние 7 дней
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const newOrders = orders.filter((order: Order) => {
        const orderDate = new Date(order.created_at);
        return orderDate > oneWeekAgo;
      }).length;
      
      return {
        newOrders,
        processingOrders,
        totalOrders: orders.length
      };
    } catch (error) {
      console.error("Error fetching orders statistics:", error);
      return {
        newOrders: 0,
        processingOrders: 0,
        totalOrders: 0
      };
    }
  },
  
  // Статистика заказов за определенный период
  async getOrdersStatsForPeriod(period: 'current-month' | 'previous-month' | 'current-week' | 'previous-week') {
    try {
      // Получаем все заказы
      const orders = await this.getOrders();
      
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      // Определяем временной интервал в зависимости от периода
      switch(period) {
        case 'current-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'previous-month':
          // Предыдущий месяц
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Последний день предыдущего месяца
          break;
        case 'current-week':
          // Начало текущей недели (понедельник)
          const dayOfWeek = now.getDay() || 7; // Преобразуем воскресенье (0) в 7
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek + 1); // Понедельник текущей недели
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'previous-week':
          // Предыдущая неделя
          const dayOfWeekPrev = now.getDay() || 7; // Преобразуем воскресенье (0) в 7
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeekPrev - 6); // Понедельник предыдущей недели
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setDate(now.getDate() - dayOfWeekPrev); // Воскресенье предыдущей недели
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      // Фильтруем заказы по выбранному периоду
      const filteredOrders = orders.filter((order: Order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      // Получаем заказы в обработке
      const processingOrders = filteredOrders.filter((order: Order) => 
        order.status === 'pending' || order.status === 'processing'
      ).length;
      
      // Новые заказы - созданные за последние 7 дней относительно конца периода
      const oneWeekAgo = new Date(endDate);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const newOrders = filteredOrders.filter((order: Order) => {
        const orderDate = new Date(order.created_at);
        return orderDate > oneWeekAgo && orderDate <= endDate;
      }).length;
      
      return {
        newOrders,
        processingOrders,
        totalOrders: filteredOrders.length
      };
    } catch (error) {
      console.error(`Error fetching orders statistics for period ${period}:`, error);
      return {
        newOrders: 0,
        processingOrders: 0,
        totalOrders: 0
      };
    }
  }
} 