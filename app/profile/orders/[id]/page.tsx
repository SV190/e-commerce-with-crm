"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { databaseService } from "@/services/database"
import { Order, OrderItem, Return } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/AuthProvider"
import { ArrowLeft, Package, Truck, CreditCard, MapPin, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Получение цвета статуса заказа
function getStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return "bg-green-500 hover:bg-green-600"
    case "shipped":
      return "bg-blue-500 hover:bg-blue-600"
    case "processing":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "pending":
      return "bg-orange-500 hover:bg-orange-600"
    case "canceled":
    case "cancelled":
      return "bg-red-500 hover:bg-red-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

// Перевод статуса заказа на русский
function translateStatus(status: string) {
  switch (status) {
    case "delivered":
      return "Доставлен"
    case "shipped":
      return "Отправлен"
    case "processing":
      return "В обработке"
    case "pending":
      return "Ожидает обработки"
    case "canceled":
    case "cancelled":
      return "Отменен"
    default:
      return status
  }
}

function OrderDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { user } = useAuth()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!user || !orderId) return
      
      try {
        setLoading(true)
        const orderData = await databaseService.getOrderById(orderId)
        
        if (!orderData) {
          setError('Заказ не найден')
          return
        }
        
        // Проверяем, принадлежит ли заказ текущему пользователю
        if (orderData.user_id !== user.id) {
          setError('У вас нет доступа к этому заказу')
          return
        }
        
        setOrder(orderData)
      } catch (err) {
        console.error("Error loading order details:", err)
        setError('Произошла ошибка при загрузке информации о заказе')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrderDetails()
  }, [orderId, user])
  
  // Функция для перехода на страницу создания возврата
  const handleCreateReturn = async () => {
    try {
      // Проверяем, есть ли уже возвраты для этого заказа
      const userReturns = await databaseService.getUserReturns(user!.id);
      
      // Находим возвраты по ID заказа
      const orderReturns = userReturns.filter((ret: Return) => ret.order_id === orderId);
      
      // Проверяем статусы существующих возвратов
      const hasRejectedReturns = orderReturns.some((ret: Return) => ret.status === 'rejected');
      const hasApprovedReturns = orderReturns.some((ret: Return) => ret.status === 'approved' || ret.status === 'completed');
      const hasPendingReturns = orderReturns.some((ret: Return) => ret.status === 'pending' || ret.status === 'processing');
      
      if (hasPendingReturns) {
        alert('У вас уже есть ожидающий рассмотрения возврат для этого заказа. Пожалуйста, дождитесь его обработки.');
        return;
      }
      
      if (hasRejectedReturns) {
        alert('Ваш запрос на возврат по данному заказу был отклонен. За подробностями обратитесь в службу поддержки.');
        return;
      }
      
      if (hasApprovedReturns) {
        alert('Для данного заказа уже был оформлен и одобрен возврат. Повторное оформление возврата невозможно.');
        return;
      }
      
      // Если возвратов нет, перенаправляем на страницу оформления
      router.push(`/returns/create?orderId=${orderId}`);
    } catch (error) {
      console.error('Ошибка при проверке возвратов:', error);
      alert('Произошла ошибка при проверке возможности оформления возврата');
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex justify-between py-4 border-b">
                      <div className="flex gap-4">
                        <Skeleton className="h-16 w-16 rounded-md" />
                        <div>
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button
          variant="outline"
          onClick={() => router.push('/profile/orders')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку заказов
        </Button>
      </div>
    )
  }
  
  if (!order) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Заказ не найден</AlertTitle>
          <AlertDescription>
            Заказ не найден или был удален. Пожалуйста, вернитесь к списку заказов.
          </AlertDescription>
        </Alert>
        
        <Button
          variant="outline"
          onClick={() => router.push('/profile/orders')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку заказов
        </Button>
      </div>
    )
  }
  
  const orderItems = order.items || []
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/profile/orders')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold">Заказ №{orderId.slice(0, 8)}</h1>
          <Badge className={getStatusColor(order.status)}>
            {translateStatus(order.status)}
          </Badge>
        </div>
        
        {(order.status === "delivered" || order.status === "shipped") && (
          <Button 
            variant="outline"
            onClick={handleCreateReturn}
            className="text-amber-600 hover:text-amber-800"
          >
            Оформить возврат
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="overflow-hidden shadow-md border border-gray-100">
            <CardHeader className="bg-gray-50 px-6 py-5 border-b">
              <CardTitle className="text-xl">Товары в заказе</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between p-6">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                        <Package className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{item.product_name}</h3>
                        <p className="text-sm text-gray-500">Количество: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.price)}</p>
                      <p className="text-sm text-gray-500">за шт.</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-6 bg-gray-50">
                <div className="flex justify-between mb-3">
                  <span className="text-gray-600">Товары:</span>
                  <span className="font-medium">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-600">Доставка:</span>
                  <span className="font-medium">Бесплатно</span>
                </div>
                <div className="flex justify-between pt-3 border-t text-lg">
                  <span className="font-bold">Итого:</span>
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="shadow-md border border-gray-100 mb-6">
            <CardHeader className="bg-gray-50 px-6 py-5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span>Информация о заказе</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Номер заказа</h3>
                <p>{orderId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Дата заказа</h3>
                <p>{formatDate(order.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Статус</h3>
                <Badge className={getStatusColor(order.status)}>
                  {translateStatus(order.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border border-gray-100 mb-6">
            <CardHeader className="bg-gray-50 px-6 py-5 border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>Адрес доставки</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p>{order.address}</p>
              {order.phone_number && <p className="mt-2">Телефон: {order.phone_number}</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-md border border-gray-100">
            <CardHeader className="bg-gray-50 px-6 py-5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-500" />
                <span>Доставка и оплата</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Способ доставки</h3>
                <p>{order.delivery_option || 'Стандартная доставка'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Способ оплаты</h3>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>
                    {order.payment_method === 'card' ? 'Банковская карта' : 
                     order.payment_method === 'cash' ? 'Наличные при получении' : 
                     'Не указан'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <ProtectedRoute>
        <OrderDetailsContent />
      </ProtectedRoute>
    </div>
  )
} 