'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useCart } from '@/components/CartContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Menu, X, ShoppingCart, User, ChevronDown, LogOut, Package, Heart, Settings, Search, Home, Truck, Phone, RefreshCcw, MessageSquare } from 'lucide-react'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [prevCartCount, setPrevCartCount] = useState(0)
  const [showCartAnimation, setShowCartAnimation] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { totalItems: cartItemsCount } = useCart()

  // Обновляем аватар при изменении данных пользователя
  useEffect(() => {
    if (user) {
      setUserAvatar(user.user_metadata?.avatar_url || null)
    }
  }, [user])

  // Проверяем изменения аватара в localStorage при фокусе на окно
  useEffect(() => {
    const checkForAvatarChanges = () => {
      if (user) {
        // При возвращении фокуса на страницу перезагружаем данные пользователя
        const supabase = window.localStorage.getItem('supabase.auth.token')
        if (supabase) {
          try {
            const parsedData = JSON.parse(supabase)
            const currentSession = parsedData?.currentSession
            if (currentSession?.user?.user_metadata?.avatar_url) {
              setUserAvatar(currentSession.user.user_metadata.avatar_url)
            }
          } catch (e) {
            console.error('Error parsing auth data', e)
          }
        }
      }
    }

    // Проверяем при фокусе на окно
    window.addEventListener('focus', checkForAvatarChanges)
    
    return () => {
      window.removeEventListener('focus', checkForAvatarChanges)
    }
  }, [user])

  // Добавляем обработчик скролла для изменения стиля навигации
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Обнаруживаем изменения количества товаров в корзине
  useEffect(() => {
    if (cartItemsCount > prevCartCount) {
      // Активируем анимацию только при увеличении
      setShowCartAnimation(true);
      
      // Отключаем анимацию через 1 секунду
      const timer = setTimeout(() => {
        setShowCartAnimation(false);
      }, 1000);
      
      // Очищаем таймер
      return () => clearTimeout(timer);
    }
    
    // Обновляем предыдущее значение
    setPrevCartCount(cartItemsCount);
  }, [cartItemsCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const getInitials = () => {
    if (!user || !user.user_metadata) return 'ЛС'
    const firstName = user.user_metadata.first_name ? user.user_metadata.first_name.charAt(0) : ''
    const lastName = user.user_metadata.last_name ? user.user_metadata.last_name.charAt(0) : ''
    return (firstName + lastName).toUpperCase() || 'ЛС'
  }
  
  // Функция для получения стандартного аватара
  const getDefaultAvatar = () => {
    if (!user) return null
    
    // Получаем инициалы
    const initials = getInitials()
    
    // Создаем URL для аватара с инициалами через API
    const colorHash = user.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0
    const hue = colorHash % 360
    const bgColor = `hsl(${hue}, 70%, 50%)`
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(bgColor.replace('#', ''))}&color=fff&size=256&bold=true`
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  // Анимация для индикатора корзины
  const badgeVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 }
  }

  return (
    <>
      {/* Верхняя информационная панель */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-2 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              <span>+7 (800) 555-35-35</span>
            </div>
            <div className="flex items-center">
              <Truck className="h-3.5 w-3.5 mr-1.5" />
              <span>Бесплатная доставка от 3000 ₽</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <Link href="/about" className="hover:text-blue-200 transition-colors">
              О компании
            </Link>
            <Link href="/delivery" className="hover:text-blue-200 transition-colors">
              Доставка
            </Link>
            <Link href="/contacts" className="hover:text-blue-200 transition-colors">
              Контакты
            </Link>
          </div>
        </div>
      </div>
      
      {/* Основная навигация */}
      <motion.header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/20 backdrop-blur-xl shadow-lg border-b border-white/20' 
            : 'bg-white/80 backdrop-blur-sm'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Логотип */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <motion.div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-3 py-2 mr-2 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Package size={20} />
                </motion.div>
                <div>
                  <motion.span 
                    className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text block"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    ЛАБУДИН СТОР
                  </motion.span>
                  <span className="text-xs text-gray-500">Надежный поставщик</span>
                </div>
              </Link>
            </div>

            {/* Поисковая строка - только на десктопе */}
            <div className="hidden md:block max-w-md w-full px-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 py-2 rounded-full border border-gray-200 focus:border-blue-400 focus:ring focus:ring-blue-200/50 transition-all"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </form>
            </div>

            {/* Десктопное меню */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              
              <Link href="/products">
                <Button 
                  variant="ghost"
                  className={`flex items-center px-3 py-2 rounded-lg relative ${
                    isActive("/products") 
                      ? "bg-blue-50 text-blue-600 font-medium" 
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <span>Каталог</span>
                  {isActive("/products") && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                      layoutId="navIndicator"
                    />
                  )}
                </Button>
              </Link>

              <Link href="/wishlist">
                <Button 
                  variant="ghost"
                  className={`flex items-center aspect-square p-2 rounded-lg relative ${
                    isActive("/wishlist") 
                      ? "bg-blue-50 text-red-500 font-medium" 
                      : "text-gray-700 hover:bg-blue-50 hover:text-red-500"
                  }`}
                  title="Избранное"
                >
                  <Heart className="h-5 w-5" fill={isActive("/wishlist") ? "currentColor" : "none"} />
                  {isActive("/wishlist") && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"
                      layoutId="navIndicatorWishlist"
                    />
                  )}
                </Button>
              </Link>
              
              <Link href="/cart">
                <div className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <ShoppingCart className={`h-6 w-6 ${showCartAnimation ? 'text-blue-600' : ''}`} />
                  <AnimatePresence>
                    {cartItemsCount > 0 && (
                      <motion.span
                        key="cart-badge"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={badgeVariants}
                        className={`absolute -top-1 -right-1 flex items-center justify-center ${
                          showCartAnimation ? 'bg-blue-600' : 'bg-red-500'
                        } text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1`}
                        style={{
                          transform: showCartAnimation ? 'scale(1.2)' : 'scale(1)',
                          transition: 'transform 0.3s ease-in-out'
                        }}
                      >
                        {cartItemsCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>

              {user ? (
                <div className="relative group">
                  <Button 
                    variant="ghost"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      isActive("/profile") 
                        ? "bg-blue-50 text-blue-600 font-medium" 
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                    title="Профиль"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt="Профиль"
                          className="h-full w-full object-cover"
                          onError={() => setUserAvatar(null)} 
                        />
                      ) : (
                        <img 
                          src={getDefaultAvatar() || ''} 
                          alt="Профиль"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <span className="hidden lg:inline-block">{user.user_metadata?.first_name || 'Профиль'}</span>
                  </Button>
                  
                  {/* Выпадающее меню профиля */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <User className="inline-block mr-2 h-4 w-4" />
                        Мой профиль
                      </Link>
                      <Link href="/profile?tab=orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Package className="inline-block mr-2 h-4 w-4" />
                        Мои заказы
                      </Link>
                      <Link href="/profile?tab=returns" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <RefreshCcw className="inline-block mr-2 h-4 w-4" />
                        Возвраты
                      </Link>
                      <Link href="/profile?tab=support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <MessageSquare className="inline-block mr-2 h-4 w-4" />
                        Поддержка
                      </Link>
                      <Link href="/profile?tab=settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Settings className="inline-block mr-2 h-4 w-4" />
                        Настройки
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link href="/auth/logout" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="inline-block mr-2 h-4 w-4" />
                        Выйти
                      </Link>
                    </div>
                  </div>
                  
                  {isActive("/profile") && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                      layoutId="navIndicatorProfile"
                    />
                  )}
                </div>
              ) : (
                <Button onClick={() => router.push('/auth/login')} variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Войти
                </Button>
              )}
            </div>

            {/* Мобильная кнопка меню */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={toggleMenu}
              >
                <span className="sr-only">Открыть меню</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Мобильное меню */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t shadow-lg">
                {/* Поисковая строка в мобильном меню */}
                <form onSubmit={handleSearch} className="relative mb-4 mt-2">
                  <Input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 py-2 rounded-full border border-gray-200 focus:border-blue-400 focus:ring focus:ring-blue-200/50 transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </form>
                
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                  Главная
                </Link>
                <Link href="/products" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                  Каталог
                </Link>
                <Link href="/wishlist" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                  Избранное
                </Link>
                <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                  <span>Корзина</span>
                  {cartItemsCount > 0 && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {cartItemsCount}
                    </div>
                  )}
                </Link>
                
                <div className="border-t border-gray-200 pt-4 pb-3">
                  {user ? (
                    <>
                      <div className="flex items-center px-4">
                        <div className="flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            {userAvatar ? (
                              <AvatarImage 
                                src={userAvatar} 
                                alt={user.user_metadata?.first_name || 'Пользователь'}
                                onError={() => setUserAvatar(null)}
                              />
                            ) : (
                              <AvatarImage 
                                src={getDefaultAvatar() || ''} 
                                alt={user.user_metadata?.first_name || 'Пользователь'} 
                              />
                            )}
                            <AvatarFallback>{getInitials()}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-800">
                            {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                          </div>
                          <div className="text-sm font-medium text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                          Профиль
                        </Link>
                        <Link href="/profile?tab=orders" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                          Мои заказы
                        </Link>
                        <Link href="/profile?tab=returns" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                          Возвраты
                        </Link>
                        <Link href="/profile?tab=support" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                          Поддержка
                        </Link>
                        <Link href="/profile?tab=settings" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600">
                          Настройки
                        </Link>
                        <Link href="/auth/logout" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50">
                          Выйти
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="px-4">
                      <Button onClick={() => { router.push('/auth/login'); setIsMenuOpen(false); }} className="w-full">
                        Войти
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
} 