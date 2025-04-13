"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { Order, Return } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/AuthProvider"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Компонент скелетон-загрузчика для списка заказов
function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 mb-6" />
      
      <div className="border rounded-md">
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
        
        <div className="p-4 border-t">
          <div className="space-y-8">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент "Нет заказов"
function NoOrders() {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-xl font-medium mb-2">У вас пока нет заказов</h2>
      <p className="text-gray-500 mb-6">Оформите первый заказ, чтобы он появился здесь</p>
      <Button 
        onClick={() => window.location.href = '/products'}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        Перейти к товарам
      </Button>
    </div>
  )
}

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

function OrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  
  // Функция для загрузки заказов
  const loadOrders = async () => {
    if (!user) return
    
    try {
      const userOrders = await databaseService.getOrdersByUserId(user.id)
      setOrders(userOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Функция для перехода на страницу создания возврата
  const handleCreateReturn = async (orderId: string) => {
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
      console.log('Переход на страницу возврата:', `/returns/create?orderId=${orderId}`);
      router.push(`/returns/create?orderId=${orderId}`);
    } catch (error) {
      console.error('Ошибка при проверке возвратов:', error);
      alert('Произошла ошибка при проверке возможности оформления возврата');
    }
  }
  
  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    setLoading(true)
    loadOrders()
    
    // Настраиваем автоматическое обновление каждые 30 секунд
    const intervalId = setInterval(() => {
      loadOrders()
    }, 30000) // 30 секунд
    
    // Очищаем интервал при размонтировании
    return () => clearInterval(intervalId)
  }, [user])
  
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

  // Обработчик отмены заказа
  const handleCancelOrder = async (orderId: string) => {
    try {
      if (confirm('Вы уверены, что хотите отменить заказ?')) {
        await databaseService.cancelOrder(orderId)
        
        // Обновляем статус заказа в интерфейсе без перезагрузки данных
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status: 'canceled' } 
              : order
          )
        )
      }
    } catch (error) {
      console.error("Error cancelling order:", error)
      alert('Произошла ошибка при отмене заказа')
    }
  }
  
  if (loading) {
    return <OrdersSkeleton />
  }
  
  if (orders.length === 0) {
    return <NoOrders />
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">История заказов</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Заказ №{order.id.slice(0, 8)}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {translateStatus(order.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">от {formatDate(order.created_at)}</p>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Link href={`/profile/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-800">
                      Детали заказа
                    </Button>
                  </Link>
                  
                  {order.status === "pending" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Отменить
                    </Button>
                  )}
                  
                  {(order.status === "delivered" || order.status === "shipped") && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-amber-600 hover:text-amber-800"
                      onClick={() => handleCreateReturn(order.id)}
                    >
                      Оформить возврат
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-5 mt-4">
                <h4 className="font-medium text-sm mb-4">Товары в заказе:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs uppercase font-medium text-gray-500 pb-3 px-4">Наименование</th>
                        <th className="text-center text-xs uppercase font-medium text-gray-500 pb-3 px-4">Кол-во</th>
                        <th className="text-right text-xs uppercase font-medium text-gray-500 pb-3 px-4">Цена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50 last:border-0">
                          <td className="py-4 px-4">{item.product_name}</td>
                          <td className="py-4 px-4 text-center">{item.quantity}</td>
                          <td className="py-4 px-4 text-right">{formatCurrency(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="pt-4 pb-2 px-4 text-right font-medium" colSpan={2}>Способ доставки:</td>
                        <td className="pt-4 pb-2 px-4 text-right">{order.delivery_option || 'Стандартная доставка'}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4 text-right font-medium" colSpan={2}>Способ оплаты:</td>
                        <td className="py-2 px-4 text-right">
                          {order.payment_method === 'card' ? 'Банковская карта' : 
                           order.payment_method === 'cash' ? 'Наличные при получении' : 
                           'Не указан'}
                        </td>
                      </tr>
                      <tr className="text-lg">
                        <td className="pt-4 px-4 text-right font-bold" colSpan={2}>Итого:</td>
                        <td className="pt-4 px-4 text-right font-bold">{formatCurrency(order.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <ProtectedRoute>
        <OrdersPageContent />
      </ProtectedRoute>
    </div>
  )
} 