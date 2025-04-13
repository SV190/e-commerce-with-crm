"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { Return } from "@/types/supabase"
import { AuthRoute } from "@/components/auth/AuthRoute"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, Search, Filter, CheckCircle, 
  XCircle, Clock, AlertTriangle, X, Image as ImageIcon, ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Временное решение - используем локальное определение компонентов диалога
// Позже мы заменим это на импорт из '@/components/ui/dialog', когда модуль будет найден
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogContent = (props: any) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
    <DialogPrimitive.Content 
      {...props}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg sm:rounded-lg",
        props.className
      )}
    >
      {props.children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Закрыть</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
const DialogHeader = (props: any) => <div className="flex flex-col space-y-1.5 text-center sm:text-left" {...props} />;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const DialogFooter = (props: any) => <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2" {...props} />;
const DialogClose = DialogPrimitive.Close;

// Функция для перевода статуса на русский язык
function translateStatus(status: string) {
  switch (status) {
    case "approved":
      return "Одобрен"
    case "rejected":
      return "Отклонен"
    case "processing":
      return "В обработке"
    case "pending":
      return "Ожидает"
    case "completed":
      return "Завершен"
    default:
      return status
  }
}

// Компонент для отображения статуса возврата
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-orange-500 hover:bg-orange-600">Ожидает</Badge>
    case 'approved':
      return <Badge className="bg-green-500 hover:bg-green-600">Подтвержден</Badge>
    case 'rejected':
      return <Badge className="bg-red-500 hover:bg-red-600">Отклонен</Badge>
    case 'completed':
      return <Badge className="bg-green-500 hover:bg-green-600">Завершен</Badge>
    case 'processing':
      return <Badge className="bg-purple-500 hover:bg-purple-600">В обработке</Badge>
    default:
      return <Badge>Неизвестно</Badge>
  }
}

// Translate reason to Russian
function translateReason(reason: string | undefined) {
  if (!reason) return "Не указана";
  
  switch (reason.toLowerCase()) {
    case 'defect':
      return 'Товар с дефектом';
    case 'wrong_item':
      return 'Не тот товар';
    case 'not_as_described':
      return 'Не соответствует описанию';
    case 'change_mind':
    case 'not_needed':
      return 'Передумал(а)';
    case 'other':
      return 'Другое';
    default:
      return reason;
  }
}

// Компонент для просмотра деталей возврата
function ReturnDetails({ returnItem, onClose }: { returnItem: Return, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [fullDetails, setFullDetails] = useState<Return | null>(null)
  
  useEffect(() => {
    const loadFullDetails = async () => {
      try {
        setLoading(true)
        const details = await databaseService.getReturnById(returnItem.id)
        setFullDetails(details)
      } catch (error) {
        console.error("Ошибка при загрузке деталей возврата:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadFullDetails()
  }, [returnItem.id])
  
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
  
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Детали возврата #{returnItem.id.slice(0, 8)}</DialogTitle>
        <DialogDescription>
          Полная информация о возврате
        </DialogDescription>
      </DialogHeader>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Основная информация</h3>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">ID возврата</dt>
                  <dd className="text-sm font-medium pr-4 break-words">{returnItem.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Продукт</dt>
                  <dd className="text-sm font-medium pr-4">{returnItem.product_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Количество</dt>
                  <dd className="text-sm font-medium">{returnItem.quantity} шт.</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Дата создания</dt>
                  <dd className="text-sm font-medium">{formatDate(returnItem.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Статус</dt>
                  <dd className="text-sm font-medium">
                    <StatusBadge status={returnItem.status} />
                  </dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Дополнительная информация</h3>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">ID заказа</dt>
                  <dd className="text-sm font-medium pr-4">
                    {returnItem.order_id === 'direct' ? 
                      'Прямой возврат без заказа' : 
                      <a 
                        href={`/crm/orders/${returnItem.order_id}`} 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {returnItem.order_id.slice(0, 8)}...
                        <ExternalLink size={12} />
                      </a>
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">ID клиента</dt>
                  <dd className="text-sm font-medium pr-4">
                    <a 
                      href={`/crm/users/${returnItem.user_id}`} 
                      className="text-blue-600 hover:underline flex items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {returnItem.user_id.slice(0, 8)}...
                      <ExternalLink size={12} />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Причина возврата</dt>
                  <dd className="text-sm font-medium pr-4">{translateReason(returnItem.reason || returnItem.return_reason)}</dd>
                </div>
                {returnItem.description && (
                  <div>
                    <dt className="text-sm text-gray-500">Описание</dt>
                    <dd className="text-sm break-words whitespace-pre-wrap pr-4">
                      {returnItem.description}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Изображения */}
          {fullDetails?.images && Array.isArray(fullDetails.images) && fullDetails.images.length > 0 ? (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Фотографии товара ({fullDetails.images.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {fullDetails.images.map((imageUrl, index) => (
                  <a 
                    key={index} 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative pt-[100%]">
                      <img 
                        src={imageUrl} 
                        alt={`Фото возврата ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Ошибка загрузки изображения ${index}:`, imageUrl);
                          // Используем валидное изображение-заглушку
                          e.currentTarget.src = 'https://placehold.co/400x400?text=Ошибка+загрузки';
                          // Отключаем переход по ссылке на ошибочное изображение
                          e.currentTarget.parentElement?.parentElement?.setAttribute('href', '#');
                          e.currentTarget.parentElement?.parentElement?.classList.add('cursor-not-allowed', 'opacity-70');
                        }}
                      />
                    </div>
                    <div className="p-2 text-xs text-center text-gray-500">
                      Фото {index + 1}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center text-gray-500 flex flex-col items-center gap-2">
              <ImageIcon className="h-6 w-6 text-gray-400" />
              <p>Нет прикрепленных изображений</p>
            </div>
          )}
        </div>
      )}
      
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Закрыть</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

// Основной компонент страницы управления возвратами
function CRMReturnsContent() {
  const router = useRouter()
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [currentReturn, setCurrentReturn] = useState<Return | null>(null)
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  
  // Загрузка данных о возвратах
  const loadReturns = async () => {
    try {
      setLoading(true)
      
      // Сначала запускаем процесс фиксации структуры базы данных
      try {
        const response = await fetch('/api/admin/fix-db');
        if (response.ok) {
          const result = await response.json();
          console.log('[loadReturns] Результат обновления структуры БД:', result);
        } else {
          console.warn('[loadReturns] Ошибка при обновлении структуры БД:', response.status);
        }
      } catch (fixDbError) {
        console.error('[loadReturns] Ошибка при вызове API обновления структуры БД:', fixDbError);
      }
      
      // Затем загружаем данные
      const data = await databaseService.getReturns()
      setReturns(data)
    } catch (error) {
      console.error("Ошибка при загрузке возвратов:", error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadReturns()
  }, [])
  
  // Функция для обновления статуса возврата
  const handleStatusChange = async (returnId: string, newStatus: Return['status']) => {
    try {
      // Запрашиваем комментарий для отклонения или если требуется дополнительная информация
      let comment = '';
      if (newStatus === 'rejected' || newStatus === 'processing') {
        comment = prompt(
          newStatus === 'rejected' 
            ? 'Введите причину отклонения возврата:' 
            : 'Добавьте комментарий для клиента (необязательно):'
        ) || '';
      }

      // Сначала пробуем напрямую обновить статус через databaseService
      // Используем этот метод, вместо API, чтобы избежать проблем с маршрутизацией
      console.log(`Обновляем статус возврата напрямую: ID=${returnId}, новый статус=${newStatus}`);
      
      try {
        // Сначала получаем текущие данные возврата
        const currentReturn = await databaseService.getReturnById(returnId);
        console.log('Текущие данные возврата:', currentReturn);

        if (!currentReturn) {
          throw new Error('Возврат не найден');
        }

        // Подготовка данных
        const updateData: any = { 
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        
        // Добавляем комментарий, если он есть
        if (comment) {
          const existingDescription = currentReturn.description || '';
          updateData.description = `${existingDescription}\n\nКомментарий администратора (${new Date().toLocaleString()}):\n${comment}`;
        }
        
        // Прямое обновление в базе данных
        const { data, error } = await supabase
          .from('returns')
          .update(updateData)
          .eq('id', returnId)
          .select();
          
        if (error) {
          console.error('Ошибка при обновлении статуса напрямую:', error);
          throw error;
        }
        
        console.log('Результат обновления:', data);
        
        // Если успешно, перезагружаем список возвратов
        const refreshedReturns = await databaseService.getReturns();
        setReturns(refreshedReturns);
        
        // Показываем сообщение об успехе
        setMessage({
          type: "success", 
          text: `Статус возврата успешно изменен на "${translateStatus(newStatus)}"`
        });
        
        // Отправляем уведомление пользователю, если возможно
        const returnData = refreshedReturns.find((ret: Return) => ret.id === returnId);
        if (returnData) {
          sendReturnNotification(returnData, newStatus, comment).catch(err => {
            console.error('Ошибка при отправке уведомления:', err);
          });
        }
        
        return; // Выходим, так как обновление прошло успешно
      } catch (directError) {
        console.error('Ошибка при прямом обновлении в базе данных:', directError);
        // Продолжаем выполнение и пробуем метод через API
      }

      // Альтернативный метод через API (используется как запасной вариант)
      console.log('Пробуем обновить через API...');
      const response = await fetch(`/api/crm/returns/${returnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          comment
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении статуса возврата через API');
      }

      // Получаем данные об обновленном возврате из ответа
      const responseData = await response.json();
      console.log('Ответ от сервера после обновления статуса:', responseData);

      // Перезагружаем список возвратов, чтобы получить актуальные данные
      try {
        const refreshedReturns = await databaseService.getReturns();
        setReturns(refreshedReturns);
        console.log('Список возвратов успешно обновлен после изменения статуса');
      } catch (refreshError) {
        console.error('Ошибка при обновлении списка возвратов:', refreshError);
        // Если не удалось обновить список, просто меняем статус локально
        setReturns(prev => 
          prev.map(item => 
            item.id === returnId 
              ? { ...item, status: newStatus } 
              : item
          )
        );
      }

      // Получаем данные о возврате, чтобы иметь информацию о пользователе
      const returnData = returns.find((ret: Return) => ret.id === returnId);
      
      // Попытка отправить уведомление, но делаем это в отдельном блоке try-catch,
      // чтобы ошибка здесь не помешала основному процессу
      if (returnData) {
        sendReturnNotification(returnData, newStatus, comment).catch(error => {
          console.error('Ошибка при отправке уведомления:', error);
        });
      }

      // Показываем сообщение об успехе
      setMessage({
        type: "success", 
        text: `Статус возврата успешно изменен на "${translateStatus(newStatus)}"`
      });
      
      // Сбрасываем выбранный возврат
      setCurrentReturn(null);
      
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      setMessage({
        type: "error", 
        text: "Не удалось обновить статус возврата"
      });
    } finally {
      // Очищаем сообщение через 5 секунд
      setTimeout(() => setMessage(null), 5000);
    }
  };
  
  // Вспомогательная функция для отправки уведомлений о возврате
  const sendReturnNotification = async (returnData: Return, newStatus: Return['status'], comment?: string) => {
    try {
      const notificationResponse = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: returnData.user_id,
          type: 'return_status_update',
          title: `Статус возврата изменен: ${translateStatus(newStatus)}`,
          message: comment ? 
            `Статус вашего возврата товара "${returnData.product_name}" изменен на "${translateStatus(newStatus)}". Комментарий: ${comment}` :
            `Статус вашего возврата товара "${returnData.product_name}" изменен на "${translateStatus(newStatus)}"`,
          data: {
            return_id: returnData.id,
            status: newStatus,
            comment: comment
          }
        }),
      });
      
      if (notificationResponse.ok) {
        console.log('Уведомление о смене статуса успешно отправлено');
        return true;
      } else {
        console.warn('Ошибка при отправке уведомления:', await notificationResponse.text());
        return false;
      }
    } catch (notifyError) {
      console.error('Ошибка при отправке уведомления:', notifyError);
      return false;
    }
  };
  
  // Фильтрация возвратов
  const filteredReturns = returns.filter(item => {
    // Фильтрация по поиску
    const matchesSearch = 
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())
    
    // Фильтрация по статусу
    const matchesFilter = 
      filter === "all" || 
      item.status === filter
    
    return matchesSearch && matchesFilter
  })
  
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
  
  // Функция для просмотра деталей возврата
  const handleViewDetails = (returnItem: Return) => {
    setSelectedReturn(returnItem)
    setDetailsOpen(true)
  }
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/crm')}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Назад в CRM
        </Button>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold">Управление возвратами</h1>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2 border rounded-md bg-white"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">Ожидает</option>
                  <option value="approved">Подтвержден</option>
                  <option value="rejected">Отклонен</option>
                  <option value="completed">Завершен</option>
                  <option value="processing">В обработке</option>
                </select>
                
                <Button 
                  variant="outline"
                  onClick={loadReturns}
                >
                  Обновить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {message && (
        <Alert variant={message.type === "success" ? "success" : "destructive"} className="animate-in fade-in">
          {message.type === "success" ? 
            <CheckCircle className="h-4 w-4" /> : 
            <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        <div className="w-full md:w-1/3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по товарам, причинам..."
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Список возвратов</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search || filter !== "all" ? "Нет возвратов, соответствующих критериям поиска" : "Нет зарегистрированных возвратов"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Товар</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Причина</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnItem) => (
                    <TableRow key={returnItem.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium">{returnItem.id.slice(0, 8)}</TableCell>
                      <TableCell>{returnItem.product_name}</TableCell>
                      <TableCell>{returnItem.user_id ? returnItem.user_id.slice(0, 8) : 'Н/Д'}</TableCell>
                      <TableCell>{returnItem.quantity}</TableCell>
                      <TableCell className="pr-4">{translateReason(returnItem.reason || returnItem.return_reason)}</TableCell>
                      <TableCell>{formatDate(returnItem.created_at)}</TableCell>
                      <TableCell><StatusBadge status={returnItem.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDetails(returnItem)}
                          >
                            <span className="sr-only">Посмотреть детали</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Button>
                          
                          {returnItem.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50 px-3"
                                onClick={() => handleStatusChange(returnItem.id, 'approved')}
                              >
                                Подтвердить
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 px-3"
                                onClick={() => handleStatusChange(returnItem.id, 'rejected')}
                              >
                                Отклонить
                              </Button>
                            </>
                          )}
                          {returnItem.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 px-3"
                              onClick={() => handleStatusChange(returnItem.id, 'completed')}
                            >
                              Завершить
                            </Button>
                          )}
                          {returnItem.status === 'rejected' && (
                            <span className="text-sm text-gray-500 italic pr-4">Заявка отклонена</span>
                          )}
                          {returnItem.status === 'completed' && (
                            <span className="text-sm text-gray-500 italic pr-4">Возврат завершен</span>
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
      
      {/* Диалог для просмотра деталей возврата */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {selectedReturn && (
          <ReturnDetails returnItem={selectedReturn} onClose={() => setDetailsOpen(false)} />
        )}
      </Dialog>
    </div>
  )
}

export default function CRMReturnsPage() {
  return (
    <AuthRoute>
      <CRMReturnsContent />
    </AuthRoute>
  )
} 