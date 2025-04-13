"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { Product } from "@/types/supabase"
import Link from "next/link"
import { CategoryGrid } from "@/components/CategoryGrid"
import { ShoppingCart, Star, TrendingUp, ArrowRight, Gift, CreditCard, Truck, Heart, Package, ChevronRight } from "lucide-react"
import { MotionDiv } from "@/components/ui/motion"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FeaturedProducts } from "@/components/FeaturedProducts"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await databaseService.getProducts()
      
      // Добавляем изображения для товаров, если их нет
      const productsWithImages = data.map(product => {
        if (!product.image_url) {
          // Анализируем и название, и описание товара для лучшего определения категории
          const searchText = (product.name + ' ' + product.description).toLowerCase();
          const category = determineCategory(searchText);
          // Подбираем точное изображение на основе ключевых слов
          const imageUrl = getSpecificProductImage(searchText, category);
          return {
            ...product,
            image_url: imageUrl
          };
        }
        return product;
      });
      
      setProducts(productsWithImages)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Улучшенная функция для определения категории товара по тексту
  const determineCategory = (text: string) => {
    // Объект, содержащий категории и соответствующие им ключевые слова
    const categoryKeywords = {
      electronics: [
        'телефон', 'смартфон', 'ноутбук', 'планшет', 'компьютер', 'гаджет', 
        'наушники', 'колонка', 'камера', 'телевизор', 'приставка', 'зарядка',
        'батарея', 'аккумулятор', 'кабель', 'провод', 'адаптер', 'мышь', 'клавиатура'
      ],
      clothing: [
        'футболка', 'джинсы', 'рубашка', 'куртка', 'платье', 'одежда',
        'брюки', 'шорты', 'юбка', 'свитер', 'толстовка', 'кофта', 'носки', 
        'обувь', 'кроссовки', 'туфли', 'ботинки', 'кеды', 'плащ', 'пальто'
      ],
      home: [
        'мебель', 'стол', 'стул', 'диван', 'кровать', 'дом', 'шкаф', 'комод', 
        'полка', 'ковер', 'штора', 'лампа', 'светильник', 'вазон', 'горшок', 
        'кастрюля', 'сковорода', 'посуда', 'бокал', 'чашка', 'тарелка'
      ],
      sports: [
        'мяч', 'тренировка', 'спорт', 'фитнес', 'гантели', 'тренажер',
        'велосипед', 'скейт', 'ролики', 'лыжи', 'сноуборд', 'бег', 'плавание',
        'коврик', 'гиря', 'штанга', 'скакалка', 'турник', 'эспандер'
      ],
      beauty: [
        'косметика', 'парфюм', 'крем', 'маска', 'помада', 'тушь', 'тени',
        'шампунь', 'кондиционер', 'лосьон', 'тоник', 'гель', 'масло', 'пудра',
        'тональный', 'румяна', 'бальзам', 'пилинг', 'скраб', 'сыворотка'
      ],
      toys: [
        'игра', 'игрушка', 'конструктор', 'кукла', 'консоль', 'машинка',
        'робот', 'головоломка', 'пазл', 'настольная', 'плюшевый', 'медведь',
        'кубики', 'набор', 'детский', 'развивающая', 'обучающая', 'мягкая игрушка'
      ],
      food: [
        'еда', 'продукты', 'питание', 'сладости', 'шоколад', 'конфеты',
        'печенье', 'торт', 'пирожное', 'чай', 'кофе', 'напиток', 'сок',
        'вода', 'газировка', 'снек', 'орехи', 'фрукты', 'овощи'
      ],
      books: [
        'книга', 'учебник', 'роман', 'журнал', 'литература', 'издание',
        'автор', 'стихи', 'поэзия', 'проза', 'детектив', 'фантастика',
        'фэнтези', 'история', 'биография', 'сборник', 'справочник'
      ]
    };
    
    // Считаем совпадения ключевых слов для каждой категории
    let categoryMatches: Record<string, number> = {};
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      categoryMatches[category] = 0;
      
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          // Увеличиваем счетчик совпадений
          categoryMatches[category]++;
        }
      }
    }
    
    // Находим категорию с наибольшим количеством совпадений
    let bestCategory = 'electronics'; // По умолчанию
    let maxMatches = 0;
    
    for (const [category, matches] of Object.entries(categoryMatches)) {
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }
    
    // Если нет совпадений ни с одной категорией, возвращаем случайную
    if (maxMatches === 0) {
      const categories = Object.keys(categoryKeywords);
      return categories[Math.floor(Math.random() * categories.length)];
    }
    
    return bestCategory;
  }

  // Новая функция для получения точного изображения товара на основе ключевых слов
  const getSpecificProductImage = (text: string, category: string) => {
    // Набор специфичных ключевых слов и соответствующих им изображений
    const specificImages: Record<string, string> = {
      // Электроника
      'iphone': 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=500&h=350&auto=format&fit=crop',
      'samsung': 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=500&h=350&auto=format&fit=crop',
      'ноутбук': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500&h=350&auto=format&fit=crop',
      'наушники': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=500&h=350&auto=format&fit=crop',
      'телевизор': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=500&h=350&auto=format&fit=crop',
      'планшет': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=500&h=350&auto=format&fit=crop',
      
      // Одежда
      'футболка': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=500&h=350&auto=format&fit=crop',
      'джинсы': 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500&h=350&auto=format&fit=crop',
      'платье': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&h=350&auto=format&fit=crop',
      'куртка': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=500&h=350&auto=format&fit=crop',
      'обувь': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=500&h=350&auto=format&fit=crop',
      
      // Дом
      'стол': 'https://images.unsplash.com/photo-1554295405-abb8fd54f153?q=80&w=500&h=350&auto=format&fit=crop',
      'стул': 'https://images.unsplash.com/photo-1561677978-583a8c7a4b43?q=80&w=500&h=350&auto=format&fit=crop',
      'диван': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=500&h=350&auto=format&fit=crop',
      'лампа': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=500&h=350&auto=format&fit=crop',
      'шкаф': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=500&h=350&auto=format&fit=crop',
      
      // Спорт
      'тренажер': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=500&h=350&auto=format&fit=crop',
      'гантели': 'https://images.unsplash.com/photo-1590645833383-c4f67e5b6af5?q=80&w=500&h=350&auto=format&fit=crop',
      'велосипед': 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=500&h=350&auto=format&fit=crop',
      'мяч': 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=500&h=350&auto=format&fit=crop',
      'скейт': 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?q=80&w=500&h=350&auto=format&fit=crop',
      
      // Красота
      'помада': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=500&h=350&auto=format&fit=crop',
      'крем': 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=500&h=350&auto=format&fit=crop',
      'духи': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500&h=350&auto=format&fit=crop',
      'шампунь': 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=500&h=350&auto=format&fit=crop',
      'маска': 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=500&h=350&auto=format&fit=crop',
      
      // Игрушки
      'конструктор': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=500&h=350&auto=format&fit=crop',
      'кукла': 'https://images.unsplash.com/photo-1598931247655-f9a3633f1330?q=80&w=500&h=350&auto=format&fit=crop',
      'машинка': 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=500&h=350&auto=format&fit=crop',
      'пазл': 'https://images.unsplash.com/photo-1606503153255-59d8b2e4739e?q=80&w=500&h=350&auto=format&fit=crop',
      'мягкая игрушка': 'https://images.unsplash.com/photo-1563901935883-cb9bb647cbb8?q=80&w=500&h=350&auto=format&fit=crop'
    };
    
    // Проверяем, содержит ли текст один из специфичных ключевых слов
    for (const [keyword, imageUrl] of Object.entries(specificImages)) {
      if (text.includes(keyword)) {
        return imageUrl;
      }
    }
    
    // Если специфичных ключевых слов не найдено, используем общее изображение для категории
    const categoryImages = {
      electronics: [
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      clothing: [
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542060748-10c28b62716f?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      home: [
        'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      sports: [
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      beauty: [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571875257727-256c39da42af?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596881924059-daba39e0fd16?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      toys: [
        'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517242810446-cc8951b2be40?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1563901935883-cb9bb647cbb8?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      food: [
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=500&h=350&auto=format&fit=crop'
      ],
      books: [
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=500&h=350&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513001900722-370f803f498d?q=80&w=500&h=350&auto=format&fit=crop'
      ]
    };
    
    // Получаем массив изображений для данной категории или используем общий массив
    const categoryImageArray = categoryImages[category as keyof typeof categoryImages] || 
      categoryImages.electronics;
    
    // Возвращаем случайное изображение из массива
    return categoryImageArray[Math.floor(Math.random() * categoryImageArray.length)];
  }

  const categories = [
    { 
      id: 'electronics', 
      name: 'Электроника', 
      icon: '💻', 
      description: 'Смартфоны, ноутбуки, планшеты и другие гаджеты',
      color: '#3B82F6' // blue-500
    },
    { 
      id: 'clothing', 
      name: 'Одежда', 
      icon: '👕', 
      description: 'Мужская, женская и детская одежда',
      color: '#10B981' // emerald-500
    },
    { 
      id: 'home', 
      name: 'Дом и сад', 
      icon: '🏠', 
      description: 'Мебель, декор и товары для дома',
      color: '#F59E0B' // amber-500
    },
    { 
      id: 'sports', 
      name: 'Спорт', 
      icon: '⚽', 
      description: 'Спортивная одежда, инвентарь и аксессуары',
      color: '#EF4444' // red-500
    },
    { 
      id: 'beauty', 
      name: 'Красота', 
      icon: '💄', 
      description: 'Косметика, парфюмерия и средства по уходу',
      color: '#EC4899' // pink-500
    },
    { 
      id: 'toys', 
      name: 'Игрушки', 
      icon: '🎮', 
      description: 'Игрушки, игры и развлечения для всех возрастов',
      color: '#8B5CF6' // violet-500
    }
  ]

  // Анимация для элементов
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  return (
    <main className="overflow-hidden">
      {/* Hero Section - Glassmorphism */}
      <section className="relative min-h-screen py-24 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-indigo-700/90 to-purple-800/90 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-700/10 z-0"></div>
        
        {/* Декоративные элементы */}
        <div className="absolute top-40 right-10 w-60 h-60 bg-pink-500/30 rounded-full filter blur-3xl z-0"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-500/30 rounded-full filter blur-3xl z-0"></div>
        <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-purple-500/20 rounded-full filter blur-3xl z-0"></div>
        
        <MotionDiv 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="container relative mx-auto px-4 z-10"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <MotionDiv 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="max-w-2xl"
            >
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 text-white leading-tight">
                Добро пожаловать в 
                <span className="text-yellow-300"> Лабудин Стор</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Широкий выбор товаров по доступным ценам с быстрой доставкой и отличным сервисом.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" variant="gradient" className="shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
                    Начать покупки <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Просмотр категорий
                  </Button>
                </Link>
              </div>
            </MotionDiv>
            
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="w-full max-w-lg"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-3xl rounded-full transform scale-110"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
                  <img 
                    src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
                    alt="Современная электроника" 
                    className="rounded-lg w-full h-64 object-cover object-center"
                    onError={(e) => {
                      // Запасное изображение, если основное не загрузится
                      e.currentTarget.src = "https://placehold.co/600x400/3b82f6/white?text=Ваш+магазин";
                    }}
                  />
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 font-bold py-3 px-5 rounded-full shadow-lg">
                    -30%
                  </div>
                  
                  <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">Хит продаж</h3>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} fill="currentColor" className="w-4 h-4 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mb-3">
                      Получите новинку прямо сейчас по специальной цене с бесплатной доставкой
                    </p>
                    <Button 
                      variant="gradient" 
                      className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold"
                    >
                      Купить сейчас
                    </Button>
                  </div>
                </div>
              </div>
            </MotionDiv>
          </div>

          {/* Статистика */}
          <MotionDiv
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20"
          >
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">500+</p>
              <p className="text-white/80 mt-2">Брендов</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">10k+</p>
              <p className="text-white/80 mt-2">Товаров</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">15k+</p>
              <p className="text-white/80 mt-2">Клиентов</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">24/7</p>
              <p className="text-white/80 mt-2">Поддержка</p>
            </div>
          </MotionDiv>
        </MotionDiv>
      </section>

      {/* Блок с преимуществами */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-center p-4">
              <Truck className="text-blue-600 mr-3 h-6 w-6" />
              <span className="font-medium">Бесплатная доставка</span>
            </div>
            <div className="flex items-center justify-center p-4">
              <CreditCard className="text-blue-600 mr-3 h-6 w-6" />
              <span className="font-medium">Безопасная оплата</span>
            </div>
            <div className="flex items-center justify-center p-4">
              <Gift className="text-blue-600 mr-3 h-6 w-6" />
              <span className="font-medium">Бонусная программа</span>
            </div>
            <div className="flex items-center justify-center p-4">
              <Star className="text-blue-600 mr-3 h-6 w-6" />
              <span className="font-medium">Гарантия качества</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Улучшенная версия */}
      <section className="py-20">
        <MotionDiv 
          className="container mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Категории товаров</h2>
            <p className="text-gray-600">Выберите интересующую вас категорию и найдите то, что ищете</p>
          </div>
          <CategoryGrid categories={categories} />
        </MotionDiv>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <MotionDiv 
            className="flex items-center justify-between mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Рекомендуемые товары</h2>
              <p className="mt-2 text-gray-600">Топовые предложения специально для вас</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                Все товары
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </MotionDiv>
          <FeaturedProducts />
        </div>
      </section>

      {/* Features Section - Улучшенная версия */}
      <section className="py-20">
        <MotionDiv 
          className="container mx-auto px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Почему выбирают нас</h2>
            <p className="text-gray-600">Мы стремимся сделать ваши покупки максимально удобными и выгодными</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MotionDiv 
              className="rounded-xl p-8 shadow-lg bg-white border border-gray-100 relative overflow-hidden"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 opacity-5">
                <img 
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
                  alt="Доставка" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Truck className="text-blue-600 h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Быстрая доставка</h3>
                <p className="text-gray-600">Доставляем заказы в течение 1-3 дней по всей стране. Для жителей крупных городов возможна доставка в день заказа.</p>
              </div>
            </MotionDiv>
            
            <MotionDiv 
              className="rounded-xl p-8 shadow-lg bg-white border border-gray-100 relative overflow-hidden"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 opacity-5">
                <img 
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                  alt="Лучшие цены" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <CreditCard className="text-blue-600 h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Лучшие цены</h3>
                <p className="text-gray-600">Регулярные акции и скидки для наших клиентов. Мы следим за рынком и гарантируем конкурентные цены на все товары.</p>
              </div>
            </MotionDiv>
            
            <MotionDiv 
              className="rounded-xl p-8 shadow-lg bg-white border border-gray-100 relative overflow-hidden"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 opacity-5">
                <img 
                  src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2070&auto=format&fit=crop"
                  alt="Гарантия качества" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Star className="text-blue-600 h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Гарантия качества</h3>
                <p className="text-gray-600">Только проверенные поставщики и качественные товары. Мы даем гарантию на все товары и предлагаем быстрый возврат.</p>
              </div>
            </MotionDiv>
          </div>
        </MotionDiv>
      </section>

      {/* CTA Section - Улучшенная версия в стиле glass */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-700/80 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/10 to-indigo-700/10 z-0"></div>
        
        {/* Декоративные элементы */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full filter blur-3xl z-0"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full filter blur-3xl z-0"></div>
        
        <MotionDiv 
          className="container mx-auto px-4 relative z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto text-center backdrop-blur-xl bg-white/10 p-10 rounded-2xl border border-white/20 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Готовы начать покупки?</h2>
            <p className="text-xl text-white/90 mb-10">Присоединяйтесь к тысячам довольных клиентов. Начните покупки уже сегодня!</p>
            <Link href="/products">
              <Button 
                size="lg" 
                variant="gradient" 
                className="bg-gradient-to-r from-white to-blue-50 text-blue-700 hover:text-blue-800 hover:shadow-xl transition-all px-8 py-6 text-lg rounded-xl"
              >
                Перейти в каталог
              </Button>
            </Link>
          </div>
        </MotionDiv>
      </section>
    </main>
  )
}
