"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { databaseService } from "@/services/database"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/components/auth/AuthProvider"
import { User, Settings, Package, RefreshCcw, CreditCard, LogOut, ShoppingCart, MessageSquare, Upload, Camera, X, ShoppingBag, Heart, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Return, Order } from "@/types/supabase"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

// Временный компонент Label для решения ошибки линтера
const Label = ({ children, htmlFor, className }: { children: React.ReactNode, htmlFor?: string, className?: string }) => (
  <label className={`block text-sm font-medium text-gray-700 ${className || ''}`} htmlFor={htmlFor}>
    {children}
  </label>
)

// Временные компоненты Avatar для решения ошибки линтера
const Avatar = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative h-10 w-10 rounded-full overflow-hidden ${className || ''}`}>
    {children}
  </div>
)

const AvatarImage = ({ src, alt }: { src?: string, alt?: string }) => (
  <img src={src || ''} alt={alt || ''} className="h-full w-full object-cover" />
)

const AvatarFallback = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex h-full w-full items-center justify-center bg-gray-100 ${className || ''}`}>
    {children}
  </div>
)

// Временные компоненты Tabs для решения ошибки линтера
const Tabs = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={className}>{children}</div>
)

const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={className}>{children}</div>
)

const TabsTrigger = ({ children, className, value, onClick }: { children: React.ReactNode, className?: string, value: string, onClick?: () => void }) => (
  <button className={className} onClick={onClick}>{children}</button>
)

const TabsContent = ({ children, className, value }: { children: React.ReactNode, className?: string, value: string }) => (
  <div className={className}>{children}</div>
)

// Временный компонент ReturnsTable пока нет реального
const ReturnsTable = ({ returns }: { returns: Return[] }) => (
  <div className="w-full">
    {returns.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <RefreshCcw className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-2">У вас пока нет возвратов</p>
        <p className="text-sm text-gray-400">Здесь будут отображаться ваши возвраты товаров</p>
      </div>
    ) : (
      <div className="grid gap-4 grid-cols-1">
        {returns.map((returnItem) => (
          <div key={returnItem.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{returnItem.product_name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                returnItem.status === "completed" ? "bg-green-100 text-green-800" :
                returnItem.status === "approved" ? "bg-blue-100 text-blue-800" :
                returnItem.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                returnItem.status === "pending" ? "bg-orange-100 text-orange-800" :
                returnItem.status === "rejected" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {returnItem.status === "completed" && "Завершен"}
                {returnItem.status === "approved" && "Одобрен"}
                {returnItem.status === "processing" && "В обработке"}
                {returnItem.status === "pending" && "Ожидает"}
                {returnItem.status === "rejected" && "Отклонен"}
                {!["completed", "approved", "processing", "pending", "rejected"].includes(returnItem.status) && returnItem.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-2">Дата создания: {new Date(returnItem.created_at).toLocaleDateString('ru-RU')}</div>
            {returnItem.reason && <div className="text-sm mb-2"><span className="font-medium">Причина:</span> {returnItem.reason}</div>}
            <div className="text-sm text-gray-700 mt-2">
              {returnItem.description && returnItem.description.length > 100 
                ? `${returnItem.description.substring(0, 100)}...` 
                : returnItem.description}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const USE_API_STORAGE = process.env.NEXT_PUBLIC_USE_API_STORAGE === 'true'

function ProfilePageContent() {
  const [activeTab, setActiveTab] = useState("profile")
  const [returns, setReturns] = useState<Return[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: ""
  })
  const [avatar, setAvatar] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, signOut } = useAuth()
  const router = useRouter()

  // Получаем параметр tab из URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'orders', 'returns', 'cart', 'payment', 'support', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Загрузка информации о пользователе
      setFormData({
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
        address: user.user_metadata?.address || ""
      })
      
      // Загрузка аватара
      setAvatar(user.user_metadata?.avatar_url || null)
    }
  }, [user])

  useEffect(() => {
    if (activeTab === "returns") {
      loadReturns()
    } else if (activeTab === "orders") {
      loadOrders()
    }
  }, [activeTab])

  const loadReturns = async () => {
    try {
      setLoading(true)
      const data = await databaseService.getReturns()
      setReturns(data)
    } catch (error) {
      console.error("Error loading returns:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        setOrders([])
        return
      }
      
      // Если включено API хранилище, загружаем реальные заказы пользователя из БД
      if (USE_API_STORAGE) {
        try {
          const orders = await databaseService.getOrdersByUserId(user.id)
          setOrders(orders)
          return
        } catch (error: any) {
          console.error("Error loading orders:", error)
          
          // Если таблицы нет, используем демо данные
          if (error?.code === '42P01') {
            console.warn('Таблица orders не существует. Используем демо данные.')
          } else {
            // Для других ошибок показываем сообщение
            console.error('Ошибка загрузки заказов:', error)
          }
        }
      }
      
      // Используем демо данные, если API хранилище отключено или произошла ошибка
      const demoOrders: Order[] = [
        {
          id: "ord_123456",
          user_id: user?.id || "",
          total: 9850,
          status: "delivered",
          address: "ул. Примерная, 123",
          payment_method: "card",
          phone_number: "+7 (999) 123-45-67",
          delivery_option: "courier",
          total_amount: 9850,
          created_at: new Date().toISOString(),
          items: [
            {
              id: "item_1",
              order_id: "ord_123456",
              product_id: "prod_1",
              product_name: "Смартфон Galaxy S20",
              price: 9850,
              quantity: 1
            }
          ]
        }
      ]
      setOrders(demoOrders)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      // Обновление метаданных пользователя
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          avatar_url: avatar
        }
      })
      
      if (error) throw error
      
      alert("Профиль успешно обновлен")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Ошибка при обновлении профиля")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      router.push('/auth/logout')
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Получаем инициалы для аватара
  const getInitials = () => {
    const firstName = formData.first_name.charAt(0) || ''
    const lastName = formData.last_name.charAt(0) || ''
    return (firstName + lastName).toUpperCase() || 'ПК'
  }

  // Функция для загрузки аватара
  const uploadAvatar = async (file: File) => {
    try {
      setUploadingAvatar(true)
      
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || '');
      
      console.log('Начинаем загрузку файла через API:', { fileName: file.name, fileSize: file.size });
      
      // Отправляем файл на сервер через API
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Ошибка загрузки: ${error.message || response.statusText}`);
      }
      
      // Получаем URL загруженного файла
      const data = await response.json();
      console.log('Ответ от API:', data);
      
      if (!data.url) {
        throw new Error('Сервер не вернул URL загруженного файла');
      }
      
      // Обновляем аватар в состоянии
      setAvatar(data.url);
      
      // Обновляем метаданные пользователя с новым аватаром
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: data.url
        }
      });
      
      if (updateError) {
        console.error('Ошибка обновления метаданных пользователя:', updateError);
      } else {
        console.log('Метаданные пользователя успешно обновлены');
      }
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      // Более информативное сообщение об ошибке
      let errorMessage = 'Ошибка при загрузке аватара.';
      
      if (error.message) {
        errorMessage += ` Причина: ${error.message}`;
      } else if (error.error_description) {
        errorMessage += ` Причина: ${error.error_description}`;
      } else if (typeof error === 'object') {
        errorMessage += ` Детали: ${JSON.stringify(error)}`;
      }
      
      alert(errorMessage);
      
      // Если API еще не реализовано, используем временный URL для тестирования
      if (process.env.NODE_ENV === 'development') {
        console.log('Используем временный URL для аватара в режиме разработки');
        const tempUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials())}&background=random&color=fff&size=256&bold=true`;
        setAvatar(tempUrl);
      }
      
    } finally {
      setUploadingAvatar(false);
    }
  }
  
  // Обработчик выбора файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 2MB')
        return
      }
      
      uploadAvatar(file)
    }
  }
  
  // Обработчик нажатия на кнопку загрузки
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }
  
  // Обработчик удаления аватара
  const handleRemoveAvatar = () => {
    setAvatar(null)
  }
  
  // Функция для получения стандартного аватара
  const getDefaultAvatar = () => {
    // Создаем URL для аватара с инициалами через API
    const initials = getInitials()
    const colorHash = user?.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0
    const hue = colorHash % 360
    const bgColor = `hsl(${hue}, 70%, 50%)`
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(bgColor.replace('#', ''))}&color=fff&size=256&bold=true`
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Личный кабинет</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2">
          <Card className="sticky top-24 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden backdrop-blur-sm bg-white/90">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <CardContent className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group mb-4">
                  <div 
                    className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md mx-auto hover:scale-105 hover:shadow-lg transition-all duration-300"
                  >
                    <img 
                      src={avatar || getDefaultAvatar()} 
                      alt="Аватар профиля" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                      <button 
                        onClick={handleUploadClick}
                        className="bg-white bg-opacity-90 rounded-full p-2 mb-2 hover:bg-opacity-100 transition-colors hover:text-blue-600 transform hover:scale-105"
                        disabled={uploadingAvatar}
                        title="Загрузить новое фото"
                      >
                        <Camera size={16} />
                      </button>
                      {avatar && (
                        <button 
                          onClick={handleRemoveAvatar}
                          className="bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-colors text-red-500 transform hover:scale-105"
                          title="Удалить фото"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{formData.first_name} {formData.last_name}</h3>
                  <p className="text-gray-500 text-sm">{formData.email}</p>
                </div>
              </div>

              <Tabs className="w-full">
                <TabsList className="flex flex-col space-y-2">
                  <TabsTrigger
                    value="profile"
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "profile" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Профиль</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    onClick={() => setActiveTab("orders")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "orders" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <span>Мои заказы</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="returns"
                    onClick={() => setActiveTab("returns")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "returns" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    <span>Возвраты</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cart"
                    onClick={() => setActiveTab("cart")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "cart" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>Корзина</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    onClick={() => setActiveTab("payment")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "payment" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Способы оплаты</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="support"
                    onClick={() => setActiveTab("support")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "support" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Поддержка</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center w-full p-3 rounded-md text-left transition-all duration-200 ${activeTab === "settings" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium shadow-sm" : "hover:bg-gray-100"}`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
            <CardFooter className="pb-6 px-6">
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 transition-all duration-200 hover:shadow-sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Основной контент */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          {activeTab === "profile" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Личные данные</CardTitle>
                <CardDescription className="text-gray-500">Обновите вашу личную информацию</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">Имя</Label>
                    <Input 
                      id="first_name" 
                      value={formData.first_name} 
                      onChange={handleInputChange}
                      className="rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">Фамилия</Label>
                    <Input 
                      id="last_name" 
                      value={formData.last_name} 
                      onChange={handleInputChange}
                      className="rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    disabled 
                    className="rounded-md border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Телефон</Label>
                  <PhoneInput 
                    id="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange}
                    className="rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Адрес доставки</Label>
                  <Input 
                    id="address" 
                    value={formData.address} 
                    onChange={handleInputChange}
                    className="rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">Сохранение</span>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </>
                  ) : (
                    <>Сохранить изменения</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "orders" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">История заказов</CardTitle>
                <CardDescription className="text-gray-500">Ваши недавние заказы</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="w-full">
                    {orders.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">У вас пока нет заказов</p>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№ заказа</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order.id}>
                              <td className="px-6 py-4 font-medium">{order.id.slice(0, 8)}</td>
                              <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                              <td className="px-6 py-4">{order.total.toLocaleString('ru-RU')} ₽</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                                  order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                                  order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                                  order.status === "pending" ? "bg-orange-100 text-orange-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {order.status === "delivered" && "Доставлен"}
                                  {order.status === "shipped" && "Отправлен"}
                                  {order.status === "processing" && "В обработке"}
                                  {order.status === "pending" && "Ожидает"}
                                  {order.status === "canceled" && "Отменен"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "returns" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Возвраты товаров</CardTitle>
                <CardDescription className="text-gray-500">Управление возвратами товаров</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Button
                      onClick={() => router.push('/returns/create')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Создать новый возврат
                    </Button>
                    
                    <ReturnsTable returns={returns} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "cart" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Корзина</CardTitle>
                <CardDescription className="text-gray-500">Товары в вашей корзине</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-10 text-gray-500">Корзина пуста</p>
                <Button className="w-full mt-4" onClick={() => router.push('/products')}>
                  Перейти к покупкам
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "payment" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardHeader className="px-6 py-5">
                <CardTitle className="text-2xl font-bold text-gray-800">Способы оплаты</CardTitle>
                <CardDescription className="text-gray-500">Управление способами оплаты</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-5 border rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <CreditCard className="h-6 w-6 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Visa **** 4242</p>
                        <p className="text-sm text-gray-500">Истекает 04/2025</p>
                      </div>
                    </div>
                    <Badge>По умолчанию</Badge>
                  </div>
                  
                  <Button className="w-full mt-4">
                    + Добавить новую карту
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "support" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardHeader className="px-6 py-5">
                <CardTitle className="text-2xl font-bold text-gray-800">Поддержка</CardTitle>
                <CardDescription className="text-gray-500">Свяжитесь с нашей службой поддержки</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Тема обращения</Label>
                    <Input id="subject" placeholder="Укажите тему вашего обращения" className="rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700">Сообщение</Label>
                    <textarea 
                      id="message" 
                      rows={5} 
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Опишите вашу проблему подробно..."
                    ></textarea>
                  </div>
                  <Button className="w-full">Отправить сообщение</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Настройки аккаунта</CardTitle>
                <CardDescription className="text-gray-500">Настройте параметры вашего аккаунта</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Уведомления о заказах</p>
                      <p className="text-sm text-gray-500">Получайте уведомления о статусе ваших заказов</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-blue-600 relative cursor-pointer">
                      <div className="h-5 w-5 rounded-full bg-white absolute top-0.5 right-0.5"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email-рассылка</p>
                      <p className="text-sm text-gray-500">Получайте информацию о новинках и акциях</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-gray-300 relative cursor-pointer">
                      <div className="h-5 w-5 rounded-full bg-white absolute top-0.5 left-0.5"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Двухфакторная аутентификация</p>
                      <p className="text-sm text-gray-500">Повысьте безопасность вашего аккаунта</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-gray-300 relative cursor-pointer">
                      <div className="h-5 w-5 rounded-full bg-white absolute top-0.5 left-0.5"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 mr-2">
                  Удалить аккаунт
                </Button>
                <Button>Сохранить настройки</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Информация о профиле</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ... существующий код ... */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/profile/orders">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-start gap-2 h-auto py-6 group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Мои заказы</div>
                    <div className="text-sm text-gray-500">История заказов</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/wishlist">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-start gap-2 h-auto py-6 group"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Избранное</div>
                    <div className="text-sm text-gray-500">Сохраненные товары</div>
                  </div>
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start gap-2 h-auto py-6 group"
                onClick={() => alert('Редактирование профиля')}
              >
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Edit className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Редактировать</div>
                  <div className="text-sm text-gray-500">Изменить данные</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start gap-2 h-auto py-6 group"
                onClick={handleLogout}
              >
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Выйти</div>
                  <div className="text-sm text-gray-500">Выйти из аккаунта</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  )
} 