"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { cartService } from "@/services/cartService"
import { Product, Order, OrderItem } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { CheckCircle, ArrowLeft, ShoppingCart } from "lucide-react"
import Link from "next/link"

// Компонент скелетон-загрузчика для чекаута
function CheckoutSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Информация о заказе</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Способ оплаты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Товары в заказе</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Skeleton className="h-12 w-40" />
      </div>
    </div>
  )
}

// Компонент пустой корзины
function EmptyCart() {
  return (
    <div className="text-center py-10">
      <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
        <ShoppingCart className="w-full h-full" />
      </div>
      <h2 className="text-xl font-medium mb-2">Ваша корзина пуста</h2>
      <p className="text-gray-500 mb-6">Добавьте товары в корзину, чтобы оформить заказ</p>
      <Link href="/products">
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          Перейти к товарам
        </Button>
      </Link>
    </div>
  )
}

// Компонент успешного заказа
function OrderSuccess({ orderId }: { orderId: string }) {
  const router = useRouter()
  
  return (
    <div className="text-center py-10">
      <div className="w-24 h-24 mx-auto mb-4 text-green-500">
        <CheckCircle className="w-full h-full" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Заказ успешно оформлен!</h2>
      <p className="text-gray-500 mb-2">Номер вашего заказа: <span className="font-medium">{orderId}</span></p>
      <p className="text-gray-500 mb-6">Мы отправили подтверждение на ваш email</p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={16} />
          На главную
        </Button>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => router.push('/profile/orders')}
        >
          Перейти к заказам
        </Button>
      </div>
    </div>
  )
}

function CheckoutPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [cartTotal, setCartTotal] = useState(0)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'card'
  })
  const [formErrors, setFormErrors] = useState({
    fullName: false,
    email: false,
    phone: false,
    address: false
  })
  
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Загружаем корзину и продукты параллельно для ускорения
        const [userCart, allProducts] = await Promise.all([
          cartService.loadUserCart(),
          databaseService.getProducts()
        ]);
        
        setCart(userCart)
        
        // Если корзина пустая, останавливаемся
        if (Object.keys(userCart).length === 0) {
          setLoading(false)
          return
        }
        
        // Отфильтровываем только продукты из корзины
        const cartProducts = allProducts.filter(product => userCart[product.id])
        setProducts(cartProducts)
        
        // Вычисляем общую стоимость
        let total = 0
        cartProducts.forEach(product => {
          const quantity = userCart[product.id]
          const price = product.discount_percentage 
            ? product.price * (1 - product.discount_percentage / 100) 
            : product.price
          total += price * quantity
        })
        
        setCartTotal(total)
        
        // Если пользователь авторизован, заполняем данные профиля
        if (user) {
          try {
            const { data, error } = await fetch(`/api/users/${user.id}`).then(res => res.json())
            
            if (data && !error) {
              setFormData(prev => ({
                ...prev,
                fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                email: data.email || user.email || '',
                phone: data.phone_number || '',
                address: data.address || ''
              }))
            }
          } catch (error) {
            console.error("Error loading user data:", error)
          }
        }
      } catch (error) {
        console.error("Error loading checkout data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user])
  
  // Обработка изменений в форме
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Сбрасываем ошибку при изменении поля
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }))
    }
  }
  
  // Валидация формы
  const validateForm = () => {
    const errors = {
      fullName: !formData.fullName.trim(),
      email: !formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email),
      phone: !formData.phone.trim(),
      address: !formData.address.trim()
    }
    
    setFormErrors(errors)
    return !Object.values(errors).some(error => error)
  }
  
  // Оформление заказа
  const placeOrder = async () => {
    if (!validateForm()) {
      return
    }
    
    try {
      setLoading(true)
      
      // Формируем данные для заказа
      const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user?.id || '',
        total: cartTotal,
        status: 'pending',
        address: formData.address,
        payment_method: formData.paymentMethod,
        phone_number: formData.phone,
        delivery_option: 'standard',
        total_amount: cartTotal
      }
      
      // Формируем элементы заказа
      const orderItems: Omit<OrderItem, 'id' | 'order_id'>[] = products.map(product => {
        const quantity = cart[product.id]
        const actualPrice = product.discount_percentage 
          ? Math.round(product.price * (1 - product.discount_percentage / 100)) 
          : product.price
          
        return {
          product_id: product.id,
          product_name: product.name,
          price: actualPrice,
          quantity
        }
      })
      
      // Создаем заказ
      const createdOrder = await databaseService.createOrder(orderData, orderItems)
      
      // Отправляем заказ в CRM
      try {
        await fetch('/api/crm/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order: {
              ...createdOrder,
              customer: {
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone
              }
            }
          }),
        });
      } catch (crmError) {
        console.error("Ошибка при отправке заказа в CRM:", crmError);
        // Не прерываем процесс оформления заказа даже в случае ошибки с CRM
      }
      
      // Очищаем корзину
      await cartService.clearCart()
      
      // Устанавливаем состояние успешного заказа
      setOrderId(createdOrder.id)
      setOrderSuccess(true)
    } catch (error) {
      console.error("Error placing order:", error)
      alert("Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.")
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <CheckoutSkeleton />
  }
  
  if (orderSuccess) {
    return <OrderSuccess orderId={orderId} />
  }
  
  if (Object.keys(cart).length === 0) {
    return <EmptyCart />
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Информация о заказе</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                ФИО получателя
              </label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Иванов Иван Иванович"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`${formErrors.fullName ? 'border-red-500' : ''}`}
              />
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-500">Пожалуйста, укажите ФИО получателя</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={handleInputChange}
                className={`${formErrors.email ? 'border-red-500' : ''}`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-500">Пожалуйста, укажите корректный email</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">
                Телефон
              </label>
              <PhoneInput
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`${formErrors.phone ? 'border-red-500' : ''}`}
              />
              {formErrors.phone && (
                <p className="mt-1 text-sm text-red-500">Пожалуйста, укажите номер телефона</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="address">
                Адрес доставки
              </label>
              <Input
                id="address"
                name="address"
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                value={formData.address}
                onChange={handleInputChange}
                className={`${formErrors.address ? 'border-red-500' : ''}`}
              />
              {formErrors.address && (
                <p className="mt-1 text-sm text-red-500">Пожалуйста, укажите адрес доставки</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Способ оплаты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="card"
                name="paymentMethod"
                value="card"
                checked={formData.paymentMethod === 'card'}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="card" className="text-gray-700 cursor-pointer">
                Банковская карта (онлайн)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="cash"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === 'cash'}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="cash" className="text-gray-700 cursor-pointer">
                Наличными при получении
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Товары в заказе</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map(product => {
              const quantity = cart[product.id]
              const actualPrice = product.discount_percentage 
                ? Math.round(product.price * (1 - product.discount_percentage / 100)) 
                : product.price
              
              return (
                <div key={product.id} className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
                          <span className="text-xl font-bold text-gray-400">
                            {product.name.substring(0, 1).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        {quantity} шт. × {actualPrice} ₽
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-gray-900">{actualPrice * quantity} ₽</div>
                </div>
              )
            })}
            
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Итого:</span>
                <span>{Math.round(cartTotal)} ₽</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => router.push('/cart')}
        >
          <ArrowLeft size={16} />
          Вернуться в корзину
        </Button>
        
        <Button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={placeOrder}
        >
          Оформить заказ
        </Button>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto p-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>
      <ProtectedRoute>
        <CheckoutPageContent />
      </ProtectedRoute>
    </div>
  )
} 