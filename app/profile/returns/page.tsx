"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Return } from "@/types/supabase"
import { databaseService } from "@/services/database"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

function ReturnsPageContent() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  const loadReturns = async () => {
    if (!user) return
    
    try {
      const userReturns = await databaseService.getUserReturns(user.id)
      setReturns(userReturns)
    } catch (error) {
      console.error("Error loading returns:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadReturns()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'На рассмотрении'
      case 'approved':
        return 'Одобрен'
      case 'rejected':
        return 'Отклонен'
      case 'completed':
        return 'Завершен'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">История возвратов</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/profile/orders')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку заказов
        </Button>
      </div>

      {returns.length === 0 ? (
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ArrowLeft className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">У вас пока нет возвратов</p>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              Если вы хотите вернуть товар, перейдите в раздел заказов и выберите опцию "Оформить возврат"
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/profile/orders')}
            >
              Перейти к заказам
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((returnItem) => (
            <Card key={returnItem.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      {returnItem.product_name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Количество: {returnItem.quantity} шт.
                    </p>
                  </div>
                  <Badge className={getStatusColor(returnItem.status)}>
                    {getStatusText(returnItem.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-col pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-700 mb-1">Причина возврата</span>
                    <span className="text-sm">{returnItem.reason}</span>
                  </div>
                  
                  {returnItem.description && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700 mb-1">Описание проблемы</span>
                      <span className="text-sm">{returnItem.description}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3">
                    <p className="text-xs text-gray-500">
                      Дата создания: {new Date(returnItem.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {returnItem.status === 'rejected' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => router.push(`/profile/orders/${returnItem.order_id}`)}
                      >
                        Перейти к заказу
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReturnsPage() {
  return (
    <div className="container mx-auto p-4 py-8 max-w-4xl">
      <ProtectedRoute>
        <ReturnsPageContent />
      </ProtectedRoute>
    </div>
  )
} 