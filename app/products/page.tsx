"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { cartService } from "@/services/cartService"
import { Product } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"
import { ShoppingCart, Heart, Search, X, SlidersHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/AuthProvider"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/components/CartContext"

// Компонент скелетон-загрузчика для карточки товара
function ProductCardSkeleton() {
  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-2 shadow-[10px_10px_20px_rgba(0,0,0,0.05),-10px_-10px_20px_rgba(255,255,255,0.9)]">
      <div className="rounded-xl overflow-hidden">
        <div className="h-48 relative overflow-hidden rounded-t-xl">
          <Skeleton className="w-full h-full" />
        </div>
        
        <div className="p-5 rounded-b-xl bg-white">
          <div className="mb-2">
            <div className="flex justify-between items-start mb-2">
              <Skeleton className="h-6 w-3/4" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
          
          <div className="h-12 mb-4">
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          
          <div className="pt-4 mt-auto border-t border-gray-100">
            <div className="flex items-end justify-between mb-4">
              <Skeleton className="h-8 w-20" />
              
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const FAVORITES_STORAGE_KEY = 'favorites'
const USE_API_STORAGE = process.env.NEXT_PUBLIC_USE_API_STORAGE === 'true'

function ProductsPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { user } = useAuth()
  const { cartItems, addToCart: addToCartContext, removeFromCart: removeFromCartContext, updateCartCount } = useCart()
  const [refreshKey, setRefreshKey] = useState(0)

  // Функция для принудительного обновления данных
  const forceRefresh = () => {
    // Принудительно сбрасываем кэш и перезагружаем данные
    cartService.clearCache();
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    // Сбрасываем кэш при монтировании компонента
    cartService.clearCache();
    updateCartCount();
    
    // Используем Promise.all для параллельного выполнения запросов
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Загружаем продукты
        await loadProducts();
        
        // Загружаем корзину
        const cartData = await cartService.loadUserCart();
        setCart(cartData);
        
        // Загружаем избранное
        await loadFavorites();
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing data:", error);
        setLoading(false);
      }
    };
    
    initialize();
    
    // Добавляем обработчик события для обновления при возвращении на страницу
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceRefresh();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshKey]); // Добавляем refreshKey в зависимости

  // Загрузка избранного из localStorage и Supabase
  const loadFavorites = async () => {
    // Загружаем избранное из localStorage
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    let favoritesObj = {}
    
    if (savedFavorites) {
      favoritesObj = JSON.parse(savedFavorites)
    }
    
    // Если включено API хранилище и пользователь авторизован, загружаем избранное из Supabase
    if (USE_API_STORAGE && user) {
      try {
        // Проверяем соединение с Supabase
        try {
          const { error: testError } = await supabase.from('products').select('id').limit(1)
          if (testError && (testError.message?.includes('Failed to fetch') || testError.code === 'NETWORK_ERROR')) {
            console.warn('Проблема с подключением к Supabase при загрузке избранных товаров.')
            console.warn('Используем только локальное хранилище.')
            setFavorites(favoritesObj)
            return
          }
        } catch (networkError) {
          console.warn('Сетевая ошибка при проверке соединения с Supabase:', networkError)
          setFavorites(favoritesObj)
          return
        }

        // Проверяем существование таблицы user_favorites
        try {
          const { error: tableCheckError } = await supabase
            .from('user_favorites')
            .select('count')
            .limit(1)
          
          if (tableCheckError) {
            if (tableCheckError.code === '42P01' || 
                ('status' in tableCheckError && (tableCheckError.status === 404 || tableCheckError.status === 406))) {
              console.warn('Таблица user_favorites не существует или не настроена. Работаем в режиме имитации.')
              setFavorites(favoritesObj)
              return
            }
          }
        } catch (tableError) {
          console.warn('Ошибка при проверке таблицы user_favorites:', tableError)
          setFavorites(favoritesObj)
          return
        }
        
        // Получаем избранное из Supabase
        const { data, error } = await supabase
          .from('user_favorites')
          .select('favorites_data')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          if (error.code === '42P01' || 
              ('status' in error && (error.status === 404 || error.status === 406))) {
            console.warn('Таблица user_favorites не существует или не настроена. Работаем в режиме имитации.')
          } else if (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR') {
            console.warn('Сетевая ошибка при загрузке избранного. Используем локальное хранилище.')
          } else if (error.code !== 'PGRST116') {
            console.error("Error fetching favorites from Supabase:", error)
          }
        } else if (data && data.favorites_data) {
          // Объединяем локальные и облачные данные избранного
          favoritesObj = { ...favoritesObj, ...data.favorites_data }
          // Обновляем localStorage
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesObj))
        }
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.code === 'NETWORK_ERROR') {
          console.warn('Сетевая ошибка при загрузке избранного:', e)
        } else {
          console.error("Error fetching favorites from Supabase:", e)
        }
      }
    }
    
    setFavorites(favoritesObj)
  }

  const loadProducts = async () => {
    try {
      const data = await databaseService.getProducts()
      setProducts(data)
      
      // Извлекаем все уникальные категории
      const uniqueCategories = Array.from(new Set(data.map(product => product.category))).filter(Boolean) as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string) => {
    // Используем ТОЛЬКО контекст корзины для обновления UI и данных
    addToCartContext(productId, 1)
    
    // НЕ вызываем cartService.addToCart напрямую, так как это уже делается внутри addToCartContext
  }

  const removeFromCart = async (productId: string) => {
    // Уменьшаем количество на 1, а не удаляем полностью
    if (cartItems[productId] > 1 || cart[productId] > 1) {
      // Используем ТОЛЬКО контекст корзины
      addToCartContext(productId, -1)
    } else {
      // Если товара 1 или меньше, удаляем полностью
      removeFromCartContext(productId)
    }
  }
  
  // Функция для полного удаления товара из корзины
  const removeCompletelyFromCart = async (productId: string) => {
    // Используем ТОЛЬКО контекст корзины
    removeFromCartContext(productId)
  }
  
  const toggleFavorite = async (productId: string) => {
    // Обновляем состояние немедленно для лучшего UX
    const updated = { 
      ...favorites, 
      [productId]: !favorites[productId] 
    }
    
    // Обновляем состояние перед асинхронными операциями
    setFavorites(updated)
    
    // Сохраняем в localStorage
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated))
    
    // Если включено API хранилище и пользователь авторизован, сохраняем в Supabase
    if (USE_API_STORAGE && user) {
      try {
        // Проверяем существование таблицы user_favorites
        try {
          const { error: tableCheckError } = await supabase
            .from('user_favorites')
            .select('count')
            .limit(1)
          
          if (tableCheckError) {
            if (tableCheckError.code === '42P01' || 
                ('status' in tableCheckError && (tableCheckError.status === 404 || tableCheckError.status === 406))) {
              console.warn('Таблица user_favorites не существует или не настроена. Пропускаем облачное сохранение.')
              setFavorites(updated)
              return
            }
          }
        } catch (tableError) {
          console.warn('Ошибка при проверке таблицы user_favorites:', tableError)
          setFavorites(updated)
          return
        }
        
        const { data, error } = await supabase
          .from('user_favorites')
          .select('favorites_data')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Запись не найдена, создаем новую
            try {
              const { error: insertError } = await supabase
                .from('user_favorites')
                .insert([{ user_id: user.id, favorites_data: updated }])
              
              if (insertError) {
                if (insertError.code === '42P01' || 
                    ('status' in insertError && (insertError.status === 404 || insertError.status === 406))) {
                  console.warn('Таблица user_favorites не существует или не настроена. Работаем в режиме имитации.')
                } else {
                  console.error('Ошибка сохранения избранного:', insertError)
                }
              }
            } catch (e) {
              console.error("Error saving favorites to Supabase:", e)
            }
          } else if (error.code === '42P01' || 
                    ('status' in error && (error.status === 404 || error.status === 406))) {
            console.warn('Таблица user_favorites не существует или не настроена. Работаем в режиме имитации.')
          } else {
            console.error('Ошибка получения избранного:', error)
          }
        } else if (data && data.favorites_data) {
          // Обновляем существующее избранное
          const { error: updateError } = await supabase
            .from('user_favorites')
            .update({ favorites_data: updated })
            .eq('user_id', user.id)
          
          if (updateError) {
            console.error('Ошибка обновления избранного:', updateError)
          }
        }
      } catch (e) {
        console.error("Error saving favorites to Supabase:", e)
      }
    }
    
    // Обновляем состояние
    setFavorites(updated)
    
    // Принудительно обновляем localStorage, чтобы гарантировать синхронизацию между страницами
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated))
    
    console.log('Товар ' + productId + (updated[productId] ? ' добавлен в' : ' удален из') + ' избранное');
  }
  
  // Функция для переключения категории фильтра
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Удаление всех выбранных фильтров
  const clearFilters = () => {
    setSelectedCategories([])
  }
  
  // Фильтрация продуктов с учетом поиска и выбранных категорий
  const filteredProducts = products
    .filter(product => 
      (searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (selectedCategories.length === 0 || 
        (product.category && selectedCategories.includes(product.category)))
    )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Каталог товаров</h1>
      
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Поиск товаров..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-12 rounded-xl border border-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>
      
      <div className="lg:flex gap-8 mb-8">
        {/* Фильтры для десктопа */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Фильтры</h3>
              {selectedCategories.length > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Сбросить все
                </button>
              )}
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Категории</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded text-blue-600 focus:ring-blue-500 mr-2 h-4 w-4"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  </div>
                ))}
                
                {categories.length === 0 && !loading && (
                  <p className="text-sm text-gray-500">Нет доступных категорий</p>
                )}
                
                {loading && (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Основное содержимое */}
        <div className="flex-1">
          {/* Кнопка фильтров для мобильных устройств */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 text-gray-700"
              >
                <SlidersHorizontal size={16} />
                <span>Фильтры</span>
              </button>
              
              {selectedCategories.length > 0 && (
                <span className="text-sm text-gray-500">
                  Выбрано: {selectedCategories.length}
                </span>
              )}
            </div>
            
            {selectedCategories.length > 0 && (
              <button 
                onClick={clearFilters}
                className="text-sm text-blue-600"
              >
                Сбросить
              </button>
            )}
          </div>
          
          {/* Выбранные фильтры */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategories.map(category => (
                <div 
                  key={category}
                  className="bg-blue-50 text-blue-700 text-sm rounded-full px-3 py-1 flex items-center"
                >
                  {category}
                  <button 
                    onClick={() => toggleCategory(category)}
                    className="ml-2 text-blue-700 hover:text-blue-900"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Результаты поиска */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              {loading 
                ? 'Загрузка товаров...' 
                : `Найдено ${filteredProducts.length} товаров`}
            </p>
          </div>
          
          {/* Список товаров */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {Array(6).fill(0).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center shadow-inner">
              <h3 className="text-lg font-medium text-gray-700 mb-2">По вашему запросу ничего не найдено</h3>
              <p className="text-gray-500 mb-4">Попробуйте изменить параметры поиска или сбросить фильтры</p>
              <Button onClick={clearFilters}>Сбросить фильтры</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group">
                  <div className="relative h-full bg-gradient-to-b from-gray-50 to-white rounded-[2rem] overflow-hidden shadow-[8px_8px_16px_rgba(174,174,192,0.4),-8px_-8px_16px_rgba(255,255,255,0.65)] hover:shadow-[12px_12px_20px_rgba(174,174,192,0.4),-12px_-12px_20px_rgba(255,255,255,0.65)] transition-all duration-300 p-4">
                    {/* Верхняя часть с изображением */}
                    <div className="h-60 relative overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-blue-50 to-indigo-50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05)]">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/600x400/3b82f6/white?text=${encodeURIComponent(product.name)}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative z-10">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(174,174,192,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
                            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text">{product.name.substring(0, 1)}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Скидка */}
                      {product.discount_percentage !== undefined && product.discount_percentage > 0 && (
                        <div className="absolute top-3 right-3 z-20">
                          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xs shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
                            -{product.discount_percentage}%
                          </div>
                        </div>
                      )}
                      
                      {/* Кнопка избранного с улучшенной анимацией */}
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(product.id);
                        }}
                        className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all duration-300 transform ${
                          favorites[product.id] 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-[2px_2px_6px_rgba(0,0,0,0.2)] scale-110' 
                            : 'bg-gradient-to-br from-white to-gray-100 text-gray-600 shadow-[4px_4px_10px_rgba(174,174,192,0.3),-4px_-4px_10px_rgba(255,255,255,0.8)] hover:scale-110'
                        }`}
                      >
                        <Heart 
                          className={`h-5 w-5 transition-all duration-300 ${
                            favorites[product.id] ? 'fill-white scale-110' : 'group-hover:scale-110'
                          }`} 
                        />
                      </button>
                      
                      {/* Нет в наличии */}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                          <div className="transform rotate-6">
                            <div className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 shadow-[2px_2px_10px_rgba(0,0,0,0.2)]">
                              <span className="text-white font-bold tracking-wider text-lg">РАСПРОДАНО</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Информация о товаре */}
                    <div className="pt-5">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-br from-white to-gray-100 text-indigo-700 shadow-[2px_2px_4px_rgba(174,174,192,0.2),-2px_-2px_4px_rgba(255,255,255,0.5)]">
                          {product.category || 'Товар'}
                        </span>
                        
                        {product.stock < 10 && product.stock > 0 && (
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-br from-white to-gray-100 text-amber-700 shadow-[2px_2px_4px_rgba(174,174,192,0.2),-2px_-2px_4px_rgba(255,255,255,0.5)]">
                            Осталось: {product.stock}
                          </span>
                        )}
                      </div>
                      
                      {/* Название */}
                      <Link href={`/products/${product.id}`} className="block mt-1 mb-1">
                        <h3 className="text-lg font-bold line-clamp-2 bg-gradient-to-r from-gray-800 to-gray-600 text-transparent bg-clip-text group-hover:from-indigo-700 group-hover:to-blue-600 transition-all duration-300">
                          {product.name}
                        </h3>
                      </Link>
                      
                      {/* Рейтинг */}
                      <div className="flex items-center mb-3">
                        <div className="flex space-x-0.5">
                          {Array.from({length: 5}).map((_, i) => (
                            <span key={i} className={`text-sm ${i < 4 ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">4.{Math.floor(Math.random() * 10)}</span>
                      </div>
                      
                      {/* Описание */}
                      <div className="relative h-12 mb-4 overflow-hidden">
                        <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                        <div className="absolute bottom-0 right-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                      </div>
                      
                      {/* Цена и кнопки */}
                      <div className="pt-4 mt-auto border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            {product.discount_percentage !== undefined && product.discount_percentage > 0 ? (
                              <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 text-transparent bg-clip-text">
                                    {Math.round(product.price * (1 - product.discount_percentage / 100))} ₽
                                  </p>
                                  <p className="text-sm text-gray-400 line-through">
                                    {Math.round(product.price)} ₽
                                  </p>
                                </div>
                                <div className="text-xs text-green-600 font-medium">
                                  Экономия: {Math.round(product.price * product.discount_percentage / 100)} ₽
                                </div>
                              </div>
                            ) : (
                              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 text-transparent bg-clip-text">{Math.round(product.price)} ₽</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* Кнопка добавления/удаления из корзины */}
                            {cartItems[product.id] > 0 || cart[product.id] > 0 ? (
                              <button 
                                onClick={() => removeCompletelyFromCart(product.id)}
                                className="relative overflow-hidden flex items-center justify-center h-11 w-11 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-full shadow-[4px_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.2)] transition-all active:scale-95"
                                title="Удалить из корзины"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ) : (
                              <button 
                                onClick={() => product.stock > 0 && addToCart(product.id)}
                                disabled={product.stock === 0}
                                className="relative overflow-hidden flex items-center justify-center h-11 w-11 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-full shadow-[4px_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:bg-gradient-to-br disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all cart-button active:scale-95"
                                title="Добавить в корзину"
                              >
                                <ShoppingCart className="h-5 w-5 cart-icon" />
                                <span className="cart-success absolute inset-0 flex items-center justify-center bg-green-500 opacity-0">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              </button>
                            )}
                            
                            {/* Кнопка "Подробнее" */}
                            <Link href={`/products/${product.id}`}>
                              <button className="h-11 px-4 bg-gradient-to-br from-white to-gray-100 text-gray-800 rounded-full shadow-[4px_4px_10px_rgba(174,174,192,0.3),-4px_-4px_10px_rgba(255,255,255,0.8)] hover:shadow-[6px_6px_12px_rgba(174,174,192,0.3),-6px_-6px_12px_rgba(255,255,255,0.8)] transition-all">
                                <span className="bg-gradient-to-r from-gray-800 to-gray-600 text-transparent bg-clip-text font-medium group-hover:from-indigo-700 group-hover:to-blue-600 transition-all duration-300">
                                  Подробнее
                                </span>
                              </button>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Показываем количество товаров в корзине, даже если локальное состояние еще не обновлено */}
                        {(cart[product.id] > 0 || cartItems[product.id] > 0) && (
                          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] mt-3">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => removeFromCart(product.id)}
                                disabled={product.stock === 0}
                                className="h-8 w-8 rounded-full bg-gradient-to-br from-white to-gray-100 text-red-600 flex items-center justify-center shadow-[2px_2px_4px_rgba(174,174,192,0.2),-2px_-2px_4px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(174,174,192,0.3),-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all active:scale-95"
                              >
                                <span className="font-bold text-sm">−</span>
                              </button>
                              
                              <div className="font-medium text-gray-700">{cartItems[product.id] || cart[product.id] || 0}</div>
                              
                              <button
                                onClick={() => addToCart(product.id)}
                                disabled={product.stock === 0}
                                className="h-8 w-8 rounded-full bg-gradient-to-br from-white to-gray-100 text-indigo-600 flex items-center justify-center shadow-[2px_2px_4px_rgba(174,174,192,0.2),-2px_-2px_4px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(174,174,192,0.3),-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all active:scale-95"
                              >
                                <span className="font-bold text-sm">+</span>
                              </button>
                            </div>
                            
                            <div className="font-bold bg-gradient-to-r from-indigo-600 to-blue-600 text-transparent bg-clip-text">
                              {Math.round(product.price * (cartItems[product.id] || cart[product.id] || 0))} ₽
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Мобильные фильтры (боковая панель) */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-md bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Фильтры</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Категории</h4>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded text-blue-600 focus:ring-blue-500 mr-2 h-5 w-5"
                        />
                        <span>{category}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  Сбросить
                </Button>
                <Button 
                  onClick={() => setShowFilters(false)}
                  className="w-full"
                >
                  Применить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <>
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-8 {
          transform: rotateY(8deg);
        }
        
        /* Анимация добавления в корзину */
        @keyframes success-animation {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes icon-hide {
          0% { transform: scale(1); opacity: 1; }
          20% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        
        .cart-button:active .cart-icon {
          animation: icon-hide 0.5s forwards;
        }
        
        .cart-button:active .cart-success {
          animation: success-animation 0.5s forwards;
        }
      `}</style>
      <ProtectedRoute>
        <ProductsPageContent />
      </ProtectedRoute>
    </>
  )
} 