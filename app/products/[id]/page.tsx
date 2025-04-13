"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { cartService } from "@/services/cartService"
import { Product } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ArrowLeft, ShoppingCart, Minus, Plus, Heart, Truck, Shield, RotateCcw, Star } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from 'next/dynamic'
import { useCart } from "@/components/CartContext"

// Временные компоненты Tabs для страницы товара
const Tabs = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-full ${className || ''}`}>{children}</div>
)

const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex space-x-2 mb-4 border-b ${className || ''}`}>{children}</div>
)

const TabsTrigger = ({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    className={`px-4 py-2 font-medium transition-colors ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
    onClick={onClick}
  >
    {children}
  </button>
)

const TabsContent = ({ children, active }: { children: React.ReactNode, active: boolean }) => (
  <div className={`${active ? 'block' : 'hidden'}`}>
    {children}
  </div>
)

// Загрузка изображений товаров по категориям
const getCategoryImage = (category: string, productName: string) => {
  // Базовые изображения для категорий
  const electronics = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586253634026-8cb574908d1e?q=80&w=1000&auto=format&fit=crop'
  ];
  
  const clothes = [
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560243563-062bfc001d68?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000&auto=format&fit=crop'
  ];
  
  const home = [
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606170033648-5d55a3edf314?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=1000&auto=format&fit=crop'
  ];
  
  const beauty = [
    'https://images.unsplash.com/photo-1571646034647-52d8e162c53c?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1000&auto=format&fit=crop'
  ];
  
  const defaultImage = 'https://placehold.co/600x400/e2e8f0/1e293b?text=Изображение+не+найдено';
  
  // Выбор категории на основе входных данных
  let images: string[] = [];
  if (category) {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('электроника')) {
      images = electronics;
    } else if (lowerCategory.includes('одежда')) {
      images = clothes;
    } else if (lowerCategory.includes('дом')) {
      images = home;
    } else if (lowerCategory.includes('красота')) {
      images = beauty;
    }
  }
  
  // Если категория не определена, пытаемся определить по имени товара
  if (images.length === 0 && productName) {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('телефон') || lowerName.includes('ноутбук') || lowerName.includes('планшет')) {
      images = electronics;
    } else if (lowerName.includes('футболка') || lowerName.includes('джинсы') || lowerName.includes('куртка')) {
      images = clothes;
    } else if (lowerName.includes('стол') || lowerName.includes('стул') || lowerName.includes('шкаф')) {
      images = home;
    } else if (lowerName.includes('крем') || lowerName.includes('помада') || lowerName.includes('шампунь')) {
      images = beauty;
    }
  }
  
  // Если ни одно условие не выполнено, используем первое изображение из электроники
  if (images.length === 0) {
    images = electronics;
  }
  
  // Вместо случайного изображения всегда берем первое для избежания проблем с гидратацией
  const firstImage: string = Array.isArray(images) && images.length > 0 ? images[0] : defaultImage;
  return firstImage;
}

// Компонент скелетон-загрузчика для деталей товара
function ProductDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Изображение товара */}
        <div className="lg:w-1/2">
          <div className="relative rounded-2xl overflow-hidden mb-4">
            <Skeleton className="w-full aspect-square" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="w-full aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Информация о товаре */}
        <div className="lg:w-1/2">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="flex items-center mb-4">
            <Skeleton className="h-5 w-24 mr-4" />
            <Skeleton className="h-5 w-16" />
          </div>
          
          <div className="mb-6">
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          
          <div className="mb-6">
            <Skeleton className="h-10 w-40 mb-2" />
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center mb-3 last:mb-0">
                <Skeleton className="h-4 w-4 mr-3 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-12 w-1/2 rounded-lg" />
            <Skeleton className="h-12 w-1/2 rounded-lg" />
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {['Описание', 'Характеристики', 'Отзывы'].map((tab) => (
              <Skeleton key={tab} className="h-10 w-32" />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    </div>
  )
}

function ProductPageContent() {
  const params = useParams()
  const router = useRouter()
  const productId = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('description')
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [activeImage, setActiveImage] = useState('')
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  
  const { cartItems, addToCart: addItemToCart } = useCart()
  const cartItemCount = cartItems[productId] || 0

  useEffect(() => {
    // Установка флага для клиентского рендеринга
    setIsMounted(true)
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Загружаем товар и корзину параллельно
        const [productData, cartData] = await Promise.all([
          databaseService.getProduct(productId),
          cartService.loadUserCart()
        ]);
        
        if (productData) {
          setProduct(productData)
          
          // Генерируем изображения на основе категории товара
          const mainImage = getCategoryImage(productData.category || '', productData.name)
          setActiveImage(mainImage)
          
          // Создаем массив миниатюр для товара
          const category = productData.category?.toLowerCase() || ''
          let images = []
          
          if (category.includes('электроника')) {
            images = [
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1000&auto=format&fit=crop'
            ]
          } else if (category.includes('одежда')) {
            images = [
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1560243563-062bfc001d68?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop'
            ]
          } else if (category.includes('дом')) {
            images = [
              'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1606170033648-5d55a3edf314?q=80&w=1000&auto=format&fit=crop'
            ]
          } else {
            images = [
              'https://images.unsplash.com/photo-1571646034647-52d8e162c53c?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop'
            ]
          }
          
          // Добавляем основное изображение в начало массива миниатюр
          images.unshift(mainImage)
          setThumbnails(images)
          
          // Загружаем похожие товары в фоне, не блокируя интерфейс
          loadSimilarProducts(productData)
        }
        
        setCart(cartData)
      } catch (error) {
        console.error("Error loading product data:", error)
        setError("Не удалось загрузить информацию о товаре")
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [productId])

  const handleAddToCart = () => {
    try {
      if (!product || product.stock <= 0) {
        console.error("Товар недоступен для добавления в корзину");
        return;
      }
      
      // Показываем анимацию добавления
      setAddingToCart(true);
      
      // Добавляем товар в корзину
      if (!addItemToCart || typeof addItemToCart !== 'function') {
        console.error("Функция addItemToCart не определена или не является функцией");
        // Резервный путь через сервис корзины
        if (cartService && typeof cartService.addToCart === 'function') {
          cartService.addToCart(product.id, quantity);
        } else {
          console.error("cartService не определен или метод addToCart недоступен");
        }
        setAddingToCart(false);
        return;
      }
      
      // Добавляем товар и обновляем состояние
      addItemToCart(product.id, quantity);
      
      // Показываем подтверждение
      setAddedToCart(true);
      setAddingToCart(false);
      
      // Сбрасываем индикатор через 1.5 секунды
      setTimeout(() => {
        setAddedToCart(false);
      }, 1500);
    } catch (error) {
      console.error("Ошибка при добавлении товара в корзину:", error);
      setAddingToCart(false);
    }
  }

  const increaseQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, product?.stock || 10))
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  const handleImageError = () => {
    setIsImageLoading(false)
    setActiveImage('https://placehold.co/600x400/e2e8f0/1e293b?text=Изображение+не+найдено')
  }

  const generateProductFeatures = () => {
    if (!product) return []
    
    // Генерируем данные о характеристиках на основе категории и имени товара
    const features = []
    
    // Добавляем общие характеристики
    features.push({ name: 'Артикул', value: product.article || product.id.substring(0, 8) })
    
    if (product.category) {
      features.push({ name: 'Категория', value: product.category })
    }
    
    // Добавляем специфичные характеристики в зависимости от категории
    const lowerCategory = (product.category || '').toLowerCase()
    const lowerName = product.name.toLowerCase()
    
    if (lowerCategory.includes('электроника') || lowerName.includes('телефон') || lowerName.includes('ноутбук')) {
      features.push({ name: 'Бренд', value: 'Samsung' })
      features.push({ name: 'Операционная система', value: 'Android 12' })
      features.push({ name: 'Процессор', value: 'Snapdragon 8 Gen 1' })
      features.push({ name: 'Оперативная память', value: '8 ГБ' })
      features.push({ name: 'Встроенная память', value: '128 ГБ' })
      features.push({ name: 'Разрешение экрана', value: '2400 x 1080 пикселей' })
    } else if (lowerCategory.includes('одежда') || lowerName.includes('футболка') || lowerName.includes('джинсы')) {
      features.push({ name: 'Бренд', value: 'Nike' })
      features.push({ name: 'Материал', value: '100% хлопок' })
      features.push({ name: 'Размер', value: 'S, M, L, XL' })
      features.push({ name: 'Цвет', value: 'Черный' })
      features.push({ name: 'Страна производства', value: 'Китай' })
    } else if (lowerCategory.includes('красота') || lowerName.includes('крем') || lowerName.includes('помада')) {
      features.push({ name: 'Бренд', value: 'L\'Oreal' })
      features.push({ name: 'Объем', value: '50 мл' })
      features.push({ name: 'Тип кожи', value: 'Для всех типов' })
      features.push({ name: 'Срок годности', value: '24 месяца' })
    }
    
    return features
  }

  const generateExtendedDescription = () => {
    if (!product || !product.description) return ''
    
    // Расширенное описание на основе базового
    let extendedDesc = product.description
    
    // Добавляем дополнительную информацию в зависимости от категории
    const lowerCategory = (product.category || '').toLowerCase()
    const lowerName = product.name.toLowerCase()
    
    if (lowerCategory.includes('электроника') || lowerName.includes('телефон') || lowerName.includes('ноутбук')) {
      extendedDesc += '\n\nУстройство оснащено мощным процессором Snapdragon 8 Gen 1, обеспечивающим плавную работу даже самых требовательных приложений. Яркий AMOLED дисплей с высоким разрешением обеспечивает отличную цветопередачу и четкость изображения. Благодаря батарее емкостью 5000 мАч вы можете пользоваться устройством целый день без подзарядки.\n\nВ комплекте: устройство, зарядное устройство, USB-кабель, инструкция пользователя, гарантийный талон.'
    } else if (lowerCategory.includes('одежда') || lowerName.includes('футболка') || lowerName.includes('джинсы')) {
      extendedDesc += '\n\nИзделие выполнено из высококачественного материала, обеспечивающего комфорт и долговечность. Современный дизайн подойдет для повседневного использования и особых случаев. Доступны различные размеры, что позволяет выбрать оптимальный вариант для каждого покупателя.\n\nРекомендации по уходу: стирка при температуре не выше 30°C, не использовать отбеливатель, гладить при средней температуре.'
    } else if (lowerCategory.includes('красота') || lowerName.includes('крем') || lowerName.includes('помада')) {
      extendedDesc += '\n\nПродукт разработан с использованием инновационных технологий, обеспечивающих эффективный уход за кожей. Не содержит парабенов и силиконов. Дерматологически протестировано. Подходит для ежедневного применения.\n\nСпособ применения: нанесите небольшое количество средства на очищенную кожу массирующими движениями до полного впитывания.'
    }
    
    return extendedDesc
  }

  // Загрузка похожих товаров
  const loadSimilarProducts = async (currentProduct: Product) => {
    try {
      const allProducts = await databaseService.getProducts()
      
      // Фильтруем товары той же категории, исключая текущий товар
      const similar = allProducts
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4)
      
      setSimilarProducts(similar)
    } catch (error) {
      console.error("Error loading similar products:", error)
    }
  }

  if (loading) {
    return <ProductDetailsSkeleton />
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
          <Link href="/products">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к каталогу
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const features = generateProductFeatures()
  const extendedDescription = generateExtendedDescription()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/products">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к каталогу
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Блок с изображениями */}
        <div>
          <Card className="overflow-hidden mb-4">
            <CardContent className="p-0 relative">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
              {isMounted && activeImage && (
                <div className="w-full h-[400px] relative bg-white">
                  <img
                    src={activeImage}
                    alt={product?.name || "Product image"}
                    className="w-full h-full object-contain"
                    onLoad={() => setIsImageLoading(false)}
                    onError={handleImageError}
                  />
                  {product?.discount_percentage && product.discount_percentage > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full py-1 px-3 font-bold z-10">
                      -{product.discount_percentage}%
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Миниатюры */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {isMounted && thumbnails.map((img, index) => (
              <div 
                key={index} 
                className={`w-20 h-20 cursor-pointer border-2 relative ${activeImage === img ? 'border-blue-500' : 'border-transparent'}`}
                onClick={() => setActiveImage(img)}
              >
                <img 
                  src={img} 
                  alt={`Миниатюра ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Информация о товаре */}
        <div>
          <Card className="h-full">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              
              <div className="flex items-center mb-2">
                <div className="flex">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-gray-500 text-sm ml-2">4.0 (12 отзывов)</span>
                <span className="text-gray-500 text-sm ml-4">Артикул: {product.article || product.id.substring(0, 8)}</span>
              </div>
              
              <div className="flex items-baseline mb-6">
                {product.discount_percentage && product.discount_percentage > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-blue-600 mr-3">
                      {Math.round(product.price * (1 - product.discount_percentage / 100))} ₽
                    </p>
                    <p className="text-xl line-through text-gray-400">
                      {product.price} ₽
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{product.price} ₽</p>
                )}
              </div>
              
              <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 flex items-center">
                <div className="mr-3">
                  {product.stock > 10 ? (
                    <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                  ) : product.stock > 0 ? (
                    <div className="bg-yellow-500 w-3 h-3 rounded-full"></div>
                  ) : (
                    <div className="bg-red-500 w-3 h-3 rounded-full"></div>
                  )}
                </div>
                <span>
                  {product.stock > 10 ? 'В наличии' : 
                   product.stock > 0 ? `Осталось ${product.stock} шт.` : 
                   'Нет в наличии'}
                </span>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">Количество</label>
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="outline" 
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    size="lg"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="text-2xl font-medium w-14 text-center">{quantity}</span>
                  <Button 
                    variant="outline" 
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    size="lg"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="mb-10 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Цена за единицу:</span>
                  <span className="font-medium">{product.price} ₽</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Итого:</span>
                  <span className="text-blue-600">{product.price * quantity} ₽</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-8 mb-10 mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleAddToCart}
                  className={`relative bg-blue-600 hover:bg-blue-700 text-lg py-6 px-8 h-auto ${addingToCart ? 'opacity-80' : ''}`}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Добавление...
                    </div>
                  ) : addedToCart ? (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      Добавлено!
                    </div>
                  ) : (
                    <>Добавить в корзину</>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleAddToCart} 
                  className="text-lg py-6 px-8 h-auto"
                  disabled={addingToCart}
                >
                  Купить сейчас
                </Button>
              </div>
              
              {/* Преимущества */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm">Бесплатная доставка</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm">Гарантия 12 месяцев</span>
                  </div>
                  <div className="flex items-center">
                    <RotateCcw className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm">Возврат в течение 14 дней</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Подробная информация о товаре */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <Tabs>
            <TabsList>
              <TabsTrigger active={activeTab === 'description'} onClick={() => setActiveTab('description')}>
                Описание
              </TabsTrigger>
              <TabsTrigger active={activeTab === 'characteristics'} onClick={() => setActiveTab('characteristics')}>
                Характеристики
              </TabsTrigger>
              <TabsTrigger active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
                Отзывы
              </TabsTrigger>
            </TabsList>
            
            <TabsContent active={activeTab === 'description'}>
              <div className="prose max-w-none">
                {extendedDescription.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent active={activeTab === 'characteristics'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Технические характеристики</h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      {features.map((feature, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-2 px-4 text-gray-600">{feature.name}</td>
                          <td className="py-2 px-4 font-medium">{feature.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Дополнительная информация</h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-4 text-gray-600">Гарантия</td>
                        <td className="py-2 px-4 font-medium">12 месяцев</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-gray-600">Производитель</td>
                        <td className="py-2 px-4 font-medium">Россия</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-2 px-4 text-gray-600">Дата добавления</td>
                        <td className="py-2 px-4 font-medium">{new Date(product.created_at).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-gray-600">Наличие</td>
                        <td className="py-2 px-4 font-medium">
                          {product.stock > 0 ? `В наличии (${product.stock} шт.)` : 'Нет в наличии'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent active={activeTab === 'reviews'}>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold mb-2">Отзывов пока нет</h3>
                  <p className="text-gray-600 mb-4">Будьте первым, кто оставит отзыв об этом товаре</p>
                  <Button>Написать отзыв</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Рекомендованные товары */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Похожие товары</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {similarProducts.map((similar) => (
            <div key={similar.id} className="text-center p-4">
              <Link href={`/products/${similar.id}`}>
                <img
                  src={getCategoryImage(similar.category || '', similar.name)}
                  alt={similar.name}
                  className="w-full h-40 object-cover"
                />
                <p className="text-gray-600 mt-2">{similar.name}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProductPage() {
  return (
    <ProtectedRoute>
      <ProductPageContent />
    </ProtectedRoute>
  )
} 