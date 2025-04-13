"use client"

import { useState, FormEvent, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, Menu, X, ShoppingCart, User, Settings, Heart, Bell, Home, Package, ArrowLeft, UserCircle } from "lucide-react"
import { cartService } from "@/services/cartService"
import { AnimatePresence } from "framer-motion"
import { MotionDiv, MotionNav, MotionSpan } from "@/components/ui/motion"
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  navigationMenuTriggerStyle 
} from "@/components/ui/navigation-menu"
import { useAuth } from "@/components/auth/AuthProvider"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCRMMenu, setShowCRMMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const { user } = useAuth()

  // Загружаем аватар пользователя
  useEffect(() => {
    if (user) {
      setUserAvatar(user.user_metadata?.avatar_url || null)
    }
  }, [user])

  // Автоматически определяем, находимся ли мы в CRM разделе
  useEffect(() => {
    const isCRMSection = pathname.startsWith('/crm') || 
                         pathname.startsWith('/defects') || 
                         pathname.startsWith('/returns') || 
                         pathname.startsWith('/reports')
    setShowCRMMenu(isCRMSection)
  }, [pathname])

  // Обновляем количество товаров в корзине
  useEffect(() => {
    const updateCartCount = () => {
      const cart = cartService.getCart()
      const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
      setCartItemsCount(count)
    }

    // Обновляем при монтировании
    updateCartCount()

    // Подписываемся на изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopping_cart') {
        updateCartCount()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Добавляем обработчик скролла для изменения стиля навигации
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.toLowerCase().includes("crm")) {
      setShowCRMMenu(true)
      router.push("/crm")
    } else {
      setShowCRMMenu(false)
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Анимация для мобильного меню
  const menuVariants = {
    closed: { opacity: 0, height: 0 },
    open: { opacity: 1, height: 'auto' }
  }

  // Анимация для индикатора корзины
  const badgeVariants = {
    initial: { scale: 0 },
    animate: { scale: 1 }
  }

  // Функция для получения стандартного аватара
  const getDefaultAvatar = () => {
    if (!user) return null
    
    // Получаем инициалы
    const firstName = user.user_metadata?.first_name || ''
    const lastName = user.user_metadata?.last_name || ''
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U'
    
    // Создаем URL для аватара с инициалами через API
    const colorHash = user.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0
    const hue = colorHash % 360
    const bgColor = `hsl(${hue}, 70%, 50%)`
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(bgColor.replace('#', ''))}&color=fff&size=256&bold=true`
  }

  return (
    <MotionNav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/20 backdrop-blur-xl border-b border-white/20 shadow-lg' 
          : 'bg-transparent backdrop-blur-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Логотип и мобильное меню */}
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100/80 text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-all"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <MotionDiv
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={20} />
                  </MotionDiv>
                ) : (
                  <MotionDiv
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={20} />
                  </MotionDiv>
                )}
              </AnimatePresence>
            </button>
            <Link href="/" className="flex items-center">
              <MotionDiv 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-3 py-2 mr-2 shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Package size={20} />
              </MotionDiv>
              <div>
                <MotionSpan 
                  className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text block"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  ЛАБУДИН СТОР
                </MotionSpan>
                <span className="text-xs text-gray-500">Надежный поставщик</span>
              </div>
            </Link>
          </div>

          {/* Поисковая строка - скрыта на мобильных */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 py-3 rounded-xl bg-white/40 border-white/30 focus:bg-white/80 focus:border-blue-400 focus:ring focus:ring-blue-200/50 transition-all"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
            </form>
          </div>

          {/* Десктопное меню */}
          <div className="hidden md:flex items-center gap-2">
            {!showCRMMenu ? (
              <>
                <Link href="/products">
                  <Button 
                    variant="ghost"
                    className={`flex items-center px-4 py-3 rounded-xl relative ${
                      isActive("/products") 
                        ? "bg-white/60 text-blue-700 font-medium shadow-sm" 
                        : "text-gray-700 hover:bg-white/40 hover:text-blue-600"
                    }`}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    <span>Каталог</span>
                    {isActive("/products") && (
                      <MotionDiv 
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full"
                        layoutId="navIndicator"
                      />
                    )}
                  </Button>
                </Link>

                <Link href="/categories">
                  <Button 
                    variant="ghost"
                    className={`flex items-center px-4 py-3 rounded-xl relative ${
                      isActive("/categories") 
                        ? "bg-white/60 text-blue-700 font-medium shadow-sm" 
                        : "text-gray-700 hover:bg-white/40 hover:text-blue-600"
                    }`}
                  >
                    <span>Категории</span>
                    {isActive("/categories") && (
                      <MotionDiv 
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full"
                        layoutId="navIndicatorCategories"
                      />
                    )}
                  </Button>
                </Link>

                <Link href="/wishlist">
                  <Button 
                    variant="ghost"
                    className={`flex items-center aspect-square p-3 rounded-xl relative ${
                      isActive("/wishlist") 
                        ? "bg-white/60 text-red-500 font-medium shadow-sm" 
                        : "text-gray-700 hover:bg-white/40 hover:text-red-500"
                    }`}
                    title="Избранное"
                  >
                    <Heart className="h-5 w-5" fill={isActive("/wishlist") ? "currentColor" : "none"} />
                    {isActive("/wishlist") && (
                      <MotionDiv 
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-red-500 rounded-full"
                        layoutId="navIndicatorWishlist"
                      />
                    )}
                  </Button>
                </Link>
                
                <Link href="/cart">
                  <Button 
                    variant="ghost"
                    className={`flex items-center aspect-square p-3 rounded-xl relative ${
                      isActive("/cart") 
                        ? "bg-white/60 text-blue-700 font-medium shadow-sm" 
                        : "text-gray-700 hover:bg-white/40 hover:text-blue-600"
                    }`}
                    title="Корзина"
                  >
                    <div className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemsCount > 0 && (
                        <MotionDiv 
                          className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md"
                          variants={badgeVariants}
                          initial="initial"
                          animate="animate"
                        >
                          {cartItemsCount}
                        </MotionDiv>
                      )}
                    </div>
                    {isActive("/cart") && (
                      <MotionDiv 
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full"
                        layoutId="navIndicatorCart"
                      />
                    )}
                  </Button>
                </Link>

                <Link href="/profile">
                  <Button 
                    variant="ghost"
                    className={`flex items-center aspect-square p-3 rounded-xl relative ${
                      isActive("/profile") 
                        ? "bg-white/60 text-blue-700 font-medium shadow-sm" 
                        : "text-gray-700 hover:bg-white/40 hover:text-blue-600"
                    }`}
                    title="Профиль"
                  >
                    {userAvatar ? (
                      <div className="h-5 w-5 rounded-full overflow-hidden">
                        <img 
                          src={userAvatar} 
                          alt="Профиль"
                          className="h-full w-full object-cover"
                          onError={() => setUserAvatar(null)} 
                        />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full overflow-hidden">
                        <img 
                          src={getDefaultAvatar() || ''} 
                          alt="Профиль"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {isActive("/profile") && (
                      <MotionDiv 
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full"
                        layoutId="navIndicatorProfile"
                      />
                    )}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/crm">
                  <Button 
                    variant="ghost"
                    className={`flex items-center px-4 py-2 relative ${
                      isActive("/crm") 
                        ? "bg-white/30 text-blue-700 font-medium" 
                        : "text-gray-700 hover:bg-white/20 hover:text-blue-600"
                    }`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>CRM Система</span>
                    {isActive("/crm") && (
                      <MotionDiv 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        layoutId="navIndicator"
                      />
                    )}
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button 
                    variant="ghost"
                    className="text-gray-700 hover:text-blue-600 p-2 rounded-full hover:bg-white/20"
                  >
                    <div className="relative">
                      <Bell className="h-5 w-5" />
                      <MotionDiv 
                        className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    </div>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Мобильное меню */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <MotionDiv 
              className="md:hidden py-4 border-t border-white/10 overflow-hidden"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSearch} className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Поиск товаров или введите 'crm'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 rounded-full bg-white/40 border-white/30"
                  variant="glass"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
              </form>
              
              {!showCRMMenu ? (
                <div className="flex flex-col space-y-2">
                  <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/products") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <Package className="mr-2 h-5 w-5" />
                      <span>Каталог</span>
                    </Button>
                  </Link>
                  
                  <Link href="/products/search" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/products/search") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <Search className="mr-2 h-5 w-5" />
                      <span>Поиск по артикулу</span>
                    </Button>
                  </Link>
                  
                  <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/wishlist") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Избранное</span>
                    </Button>
                  </Link>
                  
                  <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/cart") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <div className="relative">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {cartItemsCount > 0 && (
                          <MotionDiv 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            {cartItemsCount}
                          </MotionDiv>
                        )}
                      </div>
                      <span>Корзина</span>
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/profile") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Профиль</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link href="/crm" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/crm") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>CRM Система</span>
                    </Button>
                  </Link>
                  <Link href="/defects" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/defects") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <span>Учет брака</span>
                    </Button>
                  </Link>
                  <Link href="/returns" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/returns") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <span>Возвраты</span>
                    </Button>
                  </Link>
                  <Link href="/reports" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActive("/reports") ? "bg-white/30 text-blue-700" : ""}`}
                    >
                      <span>Отчеты</span>
                    </Button>
                  </Link>
                </div>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionNav>
  )
} 