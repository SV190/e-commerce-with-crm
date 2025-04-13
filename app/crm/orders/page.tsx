"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AuthRoute } from "@/components/auth/AuthRoute"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CRMOrder {
  id: string
  order_id: string
  order_data: any
  status: string
  processed: boolean
  created_at: string
  updated_at?: string
}

function getStatusColor(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-500 hover:bg-blue-600"
    case "confirmed":
      return "bg-green-500 hover:bg-green-600"
    case "shipped":
      return "bg-purple-500 hover:bg-purple-600"
    case "delivered":
      return "bg-indigo-500 hover:bg-indigo-600"
    case "cancelled":
      return "bg-red-500 hover:bg-red-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "new":
      return "Новый"
    case "confirmed":
      return "Подтвержден"
    case "shipped":
      return "Отправлен"
    case "delivered":
      return "Доставлен"
    case "cancelled":
      return "Отменен"
    default:
      return status
  }
}

function CRMOrdersContent() {
  const [orders, setOrders] = useState<CRMOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Загрузка заказов
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Простой запрос без проверки авторизации
        const response = await fetch('/api/crm/orders')
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить заказы')
        }
        
        const data = await response.json()
        setOrders(data.orders || [])
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error)
        setError('Не удалось загрузить заказы. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrders()
  }, [])
  
  // Обновление статуса заказа
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/crm/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error('Не удалось обновить статус заказа')
      }
      
      // Обновляем локальный список заказов
      setOrders(orders.map(order => 
        order.order_id === orderId 
        ? {...order, status: newStatus, processed: newStatus !== 'new'} 
        : order
      ))
      
      alert('Статус заказа успешно обновлен')
    } catch (error) {
      console.error('Ошибка при обновлении статуса заказа:', error)
      alert('Не удалось обновить статус заказа')
    } finally {
      setLoading(false)
    }
  }
  
  // Форматирование даты
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/crm">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Назад к CRM
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Управление заказами</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Заказы отсутствуют</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№ заказа</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_id.slice(0, 8)}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{order.order_data?.customer?.name || 'Н/Д'}</TableCell>
                      <TableCell>{order.order_data?.phone_number || order.order_data?.customer?.phone || 'Н/Д'}</TableCell>
                      <TableCell>{order.order_data?.total?.toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/crm/orders/${order.order_id}`)}
                          >
                            Детали
                          </Button>
                          
                          {order.status === 'new' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                onClick={() => updateOrderStatus(order.order_id, 'confirmed')}
                              >
                                Подтвердить
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                              >
                                Отменить
                              </Button>
                            </>
                          )}
                          
                          {order.status === 'confirmed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                              onClick={() => updateOrderStatus(order.order_id, 'shipped')}
                            >
                              Отправить
                            </Button>
                          )}
                          
                          {order.status === 'shipped' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                              onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                            >
                              Доставлен
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CRMOrdersPage() {
  return (
    <div className="container mx-auto p-4 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Управление заказами</h1>
      <AuthRoute>
        <CRMOrdersContent />
      </AuthRoute>
    </div>
  )
} 