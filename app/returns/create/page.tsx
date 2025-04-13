"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, Camera, Upload, X } from "lucide-react"
import { databaseService } from "@/services/database"
import { Order, OrderItem, Return } from "@/types/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { UploadButton } from "@/components/ui/upload-button"

function ReturnCreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { user } = useAuth()

  // Добавляем лог при инициализации компонента
  console.log('[ReturnCreate] Страница возврата инициализирована');
  console.log('[ReturnCreate] Полученный orderId:', orderId);
  console.log('[ReturnCreate] URL параметры:', Object.fromEntries(searchParams.entries()));
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || '')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    reason: '',
    description: ''
  })

  useEffect(() => {
    console.log('[ReturnCreate] useEffect вызван, user:', !!user, 'orderId:', orderId);
    
    if (user) {
      if (orderId) {
        loadOrderDetails(orderId)
        setSelectedOrderId(orderId)
      } else {
        // Если orderId не указан, загружаем список заказов пользователя
        loadUserOrders()
      }
    } else {
      console.log('[ReturnCreate] Не загружаем детали заказа, user:', !!user, 'orderId:', orderId);
      setLoading(false)
    }
  }, [user, orderId])

  // Функция для загрузки списка заказов пользователя
  const loadUserOrders = async () => {
    try {
      setLoading(true)
      console.log('[ReturnCreate] Загружаем список заказов пользователя');
      
      const orders = await databaseService.getOrdersByUserId(user!.id)
      console.log('[ReturnCreate] Загружено заказов:', orders.length);
      
      // Фильтруем заказы - показываем только доставленные
      const deliveredOrders = orders.filter(order => order.status === 'delivered')
      setUserOrders(deliveredOrders)
      
    } catch (error) {
      console.error('[ReturnCreate] Ошибка при загрузке заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  // Функция обработки выбора заказа
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId)
    loadOrderDetails(orderId)
    
    // Сбрасываем выбранный товар при смене заказа
    setFormData(prev => ({
      ...prev,
      product_id: ''
    }))
  }

  const loadOrderDetails = async (orderIdToLoad: string) => {
    try {
      setLoading(true)
      console.log('[ReturnCreate] Начинаем загрузку деталей заказа. ID:', orderIdToLoad);
      
      if (!orderIdToLoad) {
        console.error('[ReturnCreate] Отсутствует orderId для загрузки заказа');
        setLoading(false);
        return;
      }
      
      const orderData = await databaseService.getOrderById(orderIdToLoad)
      console.log('[ReturnCreate] Данные заказа получены:', orderData ? 'успешно' : 'пусто');
      
      setOrder(orderData)
      setOrderItems(orderData?.items || [])
      console.log('[ReturnCreate] Элементы заказа:', orderData?.items?.length || 0);
      
    } catch (error) {
      console.error("[ReturnCreate] Ошибка при загрузке деталей заказа:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Ограничиваем количество файлов до 5
      if (images.length >= 5) {
        alert('Вы можете загрузить не более 5 фотографий');
        return;
      }
      
      const filesToAdd = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      // Проверка файлов на размер и тип
      filesToAdd.forEach(file => {
        // Максимальный размер файла - 5 МБ
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (превышен размер 5 МБ)`);
          return;
        }
        
        // Проверяем тип файла (только изображения)
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} (неподдерживаемый формат)`);
          return;
        }
        
        // Не превышаем лимит в 5 фотографий
        if (images.length + validFiles.length < 5) {
          validFiles.push(file);
        }
      });
      
      if (invalidFiles.length > 0) {
        alert(`Следующие файлы не могут быть загружены:\n${invalidFiles.join('\n')}`);
      }
      
      if (validFiles.length === 0) {
        return;
      }
      
      setImages(prev => [...prev, ...validFiles]);
      
      // Создаем временные URL для предпросмотра
      const newImageUrls = validFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    
    // Очищаем URL для предотвращения утечек памяти
    URL.revokeObjectURL(imageUrls[index])
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const selectedItem = orderItems.find(item => item.product_id === formData.product_id)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    
    try {
      // Валидация
      if (!selectedItem || !formData.product_id || !formData.reason || formData.quantity < 1) {
        setSubmitStatus('error');
        setSubmitMessage('Пожалуйста, заполните все обязательные поля формы');
        return;
      }
      
      // Получаем данные о выбранном товаре
      const selectedProduct = await databaseService.getProduct(formData.product_id);
      if (!selectedProduct) {
        throw new Error('Товар не найден');
      }
      
      // Создаем объект возврата
      const returnData: Omit<Return, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user?.id || '',
        order_id: selectedOrderId,
        product_id: formData.product_id,
        product_name: selectedItem.product_name,
        quantity: formData.quantity,
        reason: formData.reason,
        description: formData.description,
        status: 'pending',
        images: []
      };
      
      console.log('[handleSubmit] Создание возврата с данными:', returnData);
      
      // Отправляем данные на сервер
      const createdReturn = await databaseService.createReturn(returnData);
      console.log('[handleSubmit] Возврат успешно создан:', createdReturn);
      
      // Загружаем изображения, если они есть
      if (images.length > 0) {
        try {
          let errorCount = 0;
          const uploadedImageUrls: string[] = [];
          
          for (let i = 0; i < images.length; i++) {
            console.log(`[handleSubmit] Загрузка изображения ${i+1}/${images.length}`);
            try {
              const imageUrl = await databaseService.uploadReturnImage(images[i], createdReturn.id);
              if (imageUrl && typeof imageUrl === 'string' && !imageUrl.includes('error-image')) {
                uploadedImageUrls.push(imageUrl);
                console.log(`[handleSubmit] Изображение ${i+1} успешно загружено: ${imageUrl}`);
              } else {
                console.warn(`[handleSubmit] Изображение ${i+1} загружено с ошибкой или получен URL с ошибкой`);
                errorCount++;
              }
            } catch (imgError) {
              console.error(`[handleSubmit] Ошибка при загрузке изображения ${i+1}:`, imgError);
              errorCount++;
            }
          }
          
          console.log(`[handleSubmit] Всего загружено ${uploadedImageUrls.length} изображений, ошибок: ${errorCount}`);
          
          // Обновляем возврат с загруженными URL изображений
          try {
            await databaseService.updateReturnWithImages(createdReturn.id, uploadedImageUrls);
            console.log("[handleSubmit] Возврат обновлен с URL изображений");
          } catch (updateError) {
            console.error("[handleSubmit] Ошибка при обновлении возврата с URL изображений:", updateError);
          }
          
          if (errorCount > 0 && errorCount < images.length) {
            // Если некоторые изображения не загрузились
            setSubmitMessage('Заявка на возврат создана, но не все фотографии удалось загрузить. Мы рассмотрим вашу заявку в ближайшее время.');
          }
        } catch (uploadError) {
          console.error('[handleSubmit] Ошибка при загрузке изображений:', uploadError);
          // Продолжаем выполнение, считая создание возврата успешным
          if (images.length > 0) {
            setSubmitMessage('Заявка на возврат создана, но возникли проблемы при загрузке фотографий. Мы рассмотрим вашу заявку в ближайшее время.');
          }
        }
      }

      setSubmitStatus('success')
      if (!submitMessage) {
        setSubmitMessage('Заявка на возврат успешно создана. Мы рассмотрим её в ближайшее время.')
      }

      // Перенаправляем на страницу со списком возвратов через 3 секунды
      setTimeout(() => {
        router.push('/profile/returns')
      }, 3000)
    } catch (error) {
      console.error('Error creating return:', error)
      setSubmitStatus('error')
      setSubmitMessage('Произошла ошибка при создании возврата. Пожалуйста, попробуйте позже.')
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!order && orderId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            Заказ не найден. Возможно, у вас нет доступа к этому заказу или он был удален.
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

  // Проверка на наличие товаров в заказе
  if (order && orderItems.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Заказ пуст</AlertTitle>
          <AlertDescription>
            В этом заказе нет товаров, доступных для возврата. 
            Пожалуйста, выберите другой заказ или обратитесь в службу поддержки.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Оформление возврата</h1>
      </div>

      {submitStatus === 'success' ? (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <AlertTitle>Успешно!</AlertTitle>
          <AlertDescription>{submitMessage}</AlertDescription>
        </Alert>
      ) : submitStatus === 'error' ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{submitMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Информация о возврате</CardTitle>
            <CardDescription>
              Пожалуйста, заполните все необходимые данные о товаре, который вы хотите вернуть
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!orderId && (
              <div className="mb-4">
                <Label htmlFor="order">Выберите заказ для возврата</Label>
                <Select
                  value={selectedOrderId}
                  onValueChange={handleOrderSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите заказ из списка" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Заказ №{order.id.slice(0, 8)} от {new Date(order.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userOrders.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">
                    У вас нет доставленных заказов, доступных для возврата
                  </p>
                )}
              </div>
            )}
            
            {selectedOrderId && order && (
              <>
                <div className="mb-4">
                  <Label htmlFor="product">Выберите товар для возврата</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => handleSelectChange('product_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите товар из заказа" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderItems.map((item) => (
                        <SelectItem key={item.id} value={item.product_id}>
                          {item.product_name} ({item.quantity} шт.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <>
                    <div className="mb-4">
                      <Label htmlFor="quantity">Количество для возврата</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        max={selectedItem.quantity}
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Максимальное количество для возврата: {selectedItem.quantity} шт.
                      </p>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor="reason">Причина возврата</Label>
                      <Select
                        value={formData.reason}
                        onValueChange={(value) => handleSelectChange('reason', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите причину возврата" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="defect">Товар с дефектом</SelectItem>
                          <SelectItem value="wrong_item">Не тот товар</SelectItem>
                          <SelectItem value="not_as_described">Не соответствует описанию</SelectItem>
                          <SelectItem value="change_mind">Передумал(а)</SelectItem>
                          <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor="description">Описание проблемы</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Пожалуйста, опишите проблему подробнее. Это поможет нам быстрее обработать ваш возврат."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <div className="mb-4">
                      <Label>Фотографии товара (до 5 шт.)</Label>
                      <div className="mt-2">
                        <UploadButton
                          onChange={handleFileChange}
                          accept="image/*"
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Загрузить фотографии
                        </UploadButton>
                        <p className="text-xs text-gray-500 mt-1">
                          Прикрепите фото, демонстрирующие проблему с товаром (макс. 5 фото, размер до 5 МБ каждое)
                        </p>
                      </div>

                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Изображение ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100"
                                onClick={() => removeImage(index)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={!selectedItem || !formData.reason || formData.quantity < 1 || submitStatus === 'submitting'}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {submitStatus === 'submitting' ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Отправка...
                </>
              ) : (
                'Отправить заявку на возврат'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ReturnCreatePage() {
  return (
    <div className="container mx-auto p-4 py-8 max-w-3xl">
      <ProtectedRoute>
        <ReturnCreatePageContent />
      </ProtectedRoute>
    </div>
  )
} 