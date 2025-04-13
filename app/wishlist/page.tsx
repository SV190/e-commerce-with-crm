"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { databaseService } from "@/services/database"
import { cartService } from "@/services/cartService"
import { Product } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"
import { MotionDiv } from "@/components/ui/motion"
import { ShoppingCart, Heart, Trash2, ArrowLeftCircle, SlidersHorizontal, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/AuthProvider"
import { Skeleton } from "@/components/ui/skeleton"

const FAVORITES_STORAGE_KEY = 'favorites'
const USE_API_STORAGE = process.env.NEXT_PUBLIC_USE_API_STORAGE === 'true'

// Компонент скелетон-загрузчика для карточки избранного товара
function WishlistItemSkeleton() {
  return (
    <MotionDiv 
      className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-2 shadow-[10px_10px_20px_rgba(0,0,0,0.08),-10px_-10px_20px_rgba(255,255,255,0.9)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="group overflow-hidden rounded-xl">
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
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          <div className="pt-3 mt-auto border-t border-gray-100">
            <div className="flex justify-between items-end">
              <Skeleton className="h-7 w-20" />
              
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}

function WishlistPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()
  const { user } = useAuth()
  
  useEffect(() => {
    // Инициализируем данные параллельно
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Загружаем данные параллельно
        const loadFavoritesPromise = loadFavorites();
        const loadCartPromise = cartService.loadUserCart();
        
        // Ждем загрузки корзины и устанавливаем её
        const cartData = await loadCartPromise;
        setCart(cartData);
        
        // Ждем загрузки избранного
        await loadFavoritesPromise;
      } catch (error) {
        console.error("Ошибка при инициализации данных:", error);
      } finally {
        // Завершение загрузки будет установлено в loadFavorites
      }
    };
    
    initialize();
  }, [user])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      
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
              await loadFavoritesDetails(Object.keys(favoritesObj))
              return
            }
          } catch (networkError) {
            console.warn('Сетевая ошибка при проверке соединения с Supabase:', networkError)
            
            setFavorites(favoritesObj)
            await loadFavoritesDetails(Object.keys(favoritesObj))
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
                await loadFavoritesDetails(Object.keys(favoritesObj))
                return
              }
            }
          } catch (tableError) {
            console.warn('Ошибка при проверке таблицы user_favorites:', tableError)
            setFavorites(favoritesObj)
            await loadFavoritesDetails(Object.keys(favoritesObj))
            return
          }
          
          // Получаем избранное из Supabase с правильными заголовками
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
      
      await loadFavoritesDetails(Object.keys(favoritesObj))
    } catch (error) {
      console.error("Error loading favorites:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadFavoritesDetails = async (favoriteIds: string[]) => {
    try {
      // Загружаем все товары
      const allProducts = await databaseService.getProducts()
      setProducts(allProducts)
      
      // Фильтруем только избранные товары
      const filtered = allProducts.filter(product => 
        favoriteIds.includes(product.id)
      )
      
      console.log('Найдено избранных товаров:', filtered.length)
      console.log('Идентификаторы избранных товаров:', favoriteIds)
      console.log('Все товары:', allProducts.length)
      
      setFavoriteProducts(filtered)
    } catch (error) {
      console.error("Error loading favorite product details:", error)
    }
  }

  const addToCart = async (productId: string) => {
    const updatedCart = await cartService.addToCart(productId)
    setCart(updatedCart)
  }

  const removeFromCart = async (productId: string) => {
    const updatedCart = await cartService.removeFromCart(productId)
    setCart(updatedCart)
  }
  
  const toggleFavorite = async (productId: string) => {
    const updated = { 
      ...favorites, 
      [productId]: !favorites[productId] 
    }
    
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
              if (!updated[productId]) {
                setFavoriteProducts(prev => prev.filter(p => p.id !== productId))
              }
              return
            }
          }
        } catch (tableError) {
          console.warn('Ошибка при проверке таблицы user_favorites:', tableError)
          setFavorites(updated)
          if (!updated[productId]) {
            setFavoriteProducts(prev => prev.filter(p => p.id !== productId))
          }
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
    
    // Обновляем список избранных товаров
    if (!updated[productId]) {
      setFavoriteProducts(prev => prev.filter(p => p.id !== productId))
    }
  }
  
  const removeAllFavorites = async () => {
    // Очищаем избранное в localStorage
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({}))
    
    // Если включено API хранилище и пользователь авторизован, очищаем в Supabase
    if (USE_API_STORAGE && user) {
      try {
        const { error } = await supabase
          .from('user_favorites')
          .update({ favorites_data: {} })
          .eq('user_id', user.id)
        
        if (error) {
          if (error.code === '42P01') {
            console.warn('Таблица user_favorites не существует. Работаем в режиме имитации.')
          } else {
            console.error('Ошибка очистки избранного:', error)
          }
        }
      } catch (e) {
        console.error("Error clearing favorites in Supabase:", e)
      }
    }
    
    // Обновляем состояние
    setFavorites({})
    setFavoriteProducts([])
  }

  return (
    <MotionDiv 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Избранные товары</h1>
          <p className="text-gray-600">Товары, которые вам понравились</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/products')}
            className="flex items-center gap-2"
          >
            <ArrowLeftCircle size={18} />
            <span>В каталог</span>
          </Button>
          
          {favoriteProducts.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={removeAllFavorites}
              className="flex items-center gap-2"
            >
              <Trash2 size={18} />
              <span>Очистить</span>
            </Button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, index) => (
            <WishlistItemSkeleton key={index} />
          ))}
        </div>
      ) : favoriteProducts.length === 0 ? (
        <MotionDiv 
          className="text-center py-20 bg-gray-50 rounded-2xl shadow-inner"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Heart className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <h2 className="text-2xl font-bold mb-4 text-gray-600">Список избранного пуст</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Добавляйте понравившиеся товары в избранное, нажимая на значок сердечка в карточке товара</p>
          <Button onClick={() => router.push('/products')} size="lg">
            Перейти в каталог
          </Button>
        </MotionDiv>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {favoriteProducts.map((product) => (
            <MotionDiv 
              key={product.id} 
              className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-2 shadow-[10px_10px_20px_rgba(0,0,0,0.08),-10px_-10px_20px_rgba(255,255,255,0.9)] hover:shadow-[12px_12px_24px_rgba(0,0,0,0.12),-12px_-12px_24px_rgba(255,255,255,0.95)] transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              whileHover={{ y: -5 }}
              transition={{ 
                duration: 0.3,
                type: "spring", 
                stiffness: 300,
                damping: 20
              }}
            >
              <div className="group overflow-hidden rounded-xl">
                <div className="h-48 relative overflow-hidden rounded-t-xl">
                  <Link href={`/products/${product.id}`} className="block h-full">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/600x400/3b82f6/white?text=${encodeURIComponent(product.name)}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-200 to-gray-300">
                        <div className="rounded-full bg-white w-16 h-16 flex items-center justify-center shadow-inner">
                          <span className="text-2xl font-bold text-gray-500">{product.name.substring(0, 1)}</span>
                        </div>
                      </div>
                    )}
                  </Link>
                  
                  {product.discount_percentage !== undefined && product.discount_percentage > 0 && (
                    <div className="absolute top-3 right-3 bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold py-1 px-3 text-xs rounded-full shadow-md transform group-hover:scale-110 transition-transform z-10">
                      -{product.discount_percentage}%
                    </div>
                  )}
                  
                  <button 
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center z-20 bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                    title="Удалить из избранного"
                  >
                    <Heart className="h-5 w-5 fill-white" />
                  </button>
                  
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
                      <div className="relative bg-red-600 py-2 px-6 rounded-lg shadow-lg rotate-6">
                        <div className="absolute inset-0 bg-red-500 blur-sm"></div>
                        <span className="relative text-white font-bold tracking-wider">НЕТ В НАЛИЧИИ</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-5 rounded-b-xl bg-white">
                  <div className="mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/products/${product.id}`} className="block hover:text-blue-600 transition-colors">
                        <h3 className="text-lg font-bold line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      
                      {product.stock < 10 && product.stock > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                          Осталось: {product.stock}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {product.category || 'Товар'}
                      </span>
                      
                      <div className="flex">
                        {/* Используем id товара для генерации стабильного рейтинга */}
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => {
                            // Преобразуем id в число для использования в качестве сида
                            const idSum = product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                            // Генерируем рейтинг на основе id (от 3.5 до 5)
                            const rating = 3.5 + (idSum % 15) / 10;
                            return (
                              <span 
                                key={i} 
                                className={`text-xs ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 mt-auto border-t border-gray-100">
                    <div className="flex justify-between items-end">
                      <div>
                        {product.discount_percentage !== undefined && product.discount_percentage > 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">
                              {Math.round(product.price)} ₽
                            </span>
                            <div className="text-xl font-bold text-blue-600">
                              {Math.round(product.price * (1 - product.discount_percentage / 100))} ₽
                            </div>
                          </>
                        ) : (
                          <div className="text-xl font-bold text-blue-600">
                            {Math.round(product.price)} ₽
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-3 rounded-lg"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          Подробнее
                        </Button>
                        
                        {product.stock > 0 && (
                          <Button 
                            onClick={() => addToCart(product.id)} 
                            disabled={product.stock === 0}
                            className="rounded-lg"
                            size="sm"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      )}
    </MotionDiv>
  )
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistPageContent />
    </ProtectedRoute>
  )
} 