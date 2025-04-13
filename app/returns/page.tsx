"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { Return } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/components/auth/AuthProvider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, HelpCircle, XCircle } from "lucide-react"

// Компонент отображения статуса возврата
function ReturnStatus({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <div className="flex items-center text-orange-500">
          <Clock className="mr-2 h-4 w-4" />
          <span>Ожидает рассмотрения</span>
        </div>
      )
    case 'approved':
      return (
        <div className="flex items-center text-green-500">
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Подтвержден</span>
        </div>
      )
    case 'rejected':
      return (
        <div className="flex items-center text-red-500">
          <XCircle className="mr-2 h-4 w-4" />
          <span>Отклонен</span>
        </div>
      )
    case 'completed':
      return (
        <div className="flex items-center text-blue-500">
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Возврат завершен</span>
        </div>
      )
    case 'processing':
      return (
        <div className="flex items-center text-purple-500">
          <Clock className="mr-2 h-4 w-4" />
          <span>В обработке</span>
        </div>
      )
    default:
      return (
        <div className="flex items-center text-gray-500">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Неизвестно</span>
        </div>
      )
  }
}

function ReturnsPageContent() {
  const { user } = useAuth()
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    product_name: "",
    quantity: 0,
    return_reason: "",
    batch_number: "",
    description: ""
  })
  const [displayQuantity, setDisplayQuantity] = useState("")
  const [submitMessage, setSubmitMessage] = useState<{type: "success" | "error", text: string} | null>(null)

  useEffect(() => {
    if (user) {
      loadReturns()
    }
  }, [user])

  const loadReturns = async () => {
    try {
      setLoading(true)
      if (!user) {
        setReturns([])
        setLoading(false)
        return
      }
      
      // Используем getUserReturns вместо getReturns для получения только возвратов текущего пользователя
      const userReturns = await databaseService.getUserReturns(user.id)
      setReturns(userReturns)
    } catch (error) {
      console.error("Error loading returns:", error)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'quantity') {
      // Обновляем отображаемое значение
      setDisplayQuantity(value)
      
      // Если введено значение "0", очищаем поле
      if (value === '0') {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }))
      } else {
        // Иначе преобразуем в число или оставляем 0
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? 0 : parseInt(value) || 0
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setSubmitMessage({
        type: "error",
        text: "Необходимо авторизоваться для оформления возврата"
      })
      return
    }
    
    try {      
      const result = await databaseService.createReturn({
        product_name: formData.product_name,
        quantity: formData.quantity,
        reason: `${formData.return_reason} (Партия: ${formData.batch_number})`,
        status: 'pending',
        order_id: 'direct', // Прямой возврат без привязки к заказу
        product_id: 'unknown', // Идентификатор продукта неизвестен
        user_id: user?.id || '' // Добавляем ID пользователя
      })
      
      // Сброс формы
      setFormData({
        product_name: "",
        quantity: 0,
        return_reason: "",
        batch_number: "",
        description: ""
      })
      setDisplayQuantity("")
      
      // Показываем сообщение об успехе
      setSubmitMessage({
        type: "success",
        text: "Ваша заявка на возврат успешно отправлена и будет рассмотрена в ближайшее время"
      })
      
      // Перезагружаем список возвратов
      loadReturns()
    } catch (error) {
      console.error("Error creating return:", error)
      setSubmitMessage({
        type: "error",
        text: "Ошибка при сохранении возврата. Пожалуйста, попробуйте снова."
      })
    }
    
    // Очищаем сообщение через 5 секунд
    setTimeout(() => setSubmitMessage(null), 5000)
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

  // Переводим причину возврата на русский
  const translateReason = (reason: string) => {
    switch (reason) {
      case 'quality':
        return 'Качество'
      case 'damage':
        return 'Повреждение'
      case 'wrong':
        return 'Неверный товар'
      case 'other':
        return 'Другое'
      default:
        return reason
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Возврат товаров</h1>
      
      {submitMessage && (
        <Alert 
          variant={submitMessage.type === "success" ? "success" : "destructive"} 
          className="mb-6 animate-in fade-in"
        >
          {submitMessage.type === "success" ? 
            <CheckCircle className="h-4 w-4" /> : 
            <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{submitMessage.text}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Оформление возврата</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Наименование товара
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Введите наименование"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Количество
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={displayQuantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Введите количество"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Причина возврата
                </label>
                <select 
                  name="return_reason"
                  value={formData.return_reason}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Выберите причину</option>
                  <option value="quality">Качество</option>
                  <option value="damage">Повреждение</option>
                  <option value="wrong">Неверный товар</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Номер партии
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Введите номер партии"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Опишите причину возврата подробнее"
                  required
                  rows={3}
                />
              </div>
              
              <Button type="submit" className="w-full">
                Отправить заявку на возврат
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>История возвратов</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : returns.length === 0 ? (
              <p className="text-center text-gray-500">У вас нет оформленных возвратов</p>
            ) : (
              <div className="space-y-4">
                {returns.map((returnItem) => (
                  <div key={returnItem.id} className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-lg">{returnItem.product_name}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <p className="text-sm text-gray-600">Количество:</p>
                      <p className="text-sm font-medium">{returnItem.quantity} шт.</p>
                      
                      <p className="text-sm text-gray-600">Причина:</p>
                      <p className="text-sm font-medium">{translateReason(returnItem.reason)}</p>
                      
                      <p className="text-sm text-gray-600">Дата:</p>
                      <p className="text-sm">{formatDate(returnItem.created_at)}</p>
                      
                      <p className="text-sm text-gray-600">Статус:</p>
                      <ReturnStatus status={returnItem.status} />
                    </div>
                    
                    {returnItem.status === 'rejected' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md text-sm">
                        <p className="font-medium text-red-700">Пояснение:</p>
                        <p className="text-red-600">Ваша заявка отклонена. Для уточнения причин, пожалуйста, свяжитесь с нашей службой поддержки.</p>
                      </div>
                    )}
                    
                    {returnItem.status === 'approved' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md text-sm">
                        <p className="font-medium text-green-700">Пояснение:</p>
                        <p className="text-green-600">Ваша заявка одобрена. Ожидайте дальнейших инструкций по возврату.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ReturnsPage() {
  return (
    <ProtectedRoute>
      <ReturnsPageContent />
    </ProtectedRoute>
  )
} 