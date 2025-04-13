"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShoppingBag, 
  RefreshCcw, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  TimerOff, 
  Info,
  AlertTriangle,
  Package,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { databaseService } from "@/services/database"
import { Return } from "@/types/supabase"
import { AuthRoute } from '@/components/auth/AuthRoute'
import { Badge } from "@/components/ui/badge"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts'

function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  color = "blue" 
}: { 
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend?: number;
  color?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden border-0 shadow-sm">
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium text-gray-700">{title}</CardTitle>
          <div className={`p-2 rounded-full bg-${color}-50`}>
            {icon}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center mt-1 text-sm">
            <ArrowUpRight className={`h-4 w-4 mr-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
              {trend >= 0 ? '+' : ''}{trend}% за месяц
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CRMContent() {
  // Состояние для хранения данных из API
  const [recentReturns, setRecentReturns] = useState<Return[]>([])
  const [defects, setDefects] = useState<any[]>([])
  const [ordersStats, setOrdersStats] = useState<{
    newOrders: number;
    processingOrders: number;
    totalOrders: number;
  }>({ newOrders: 0, processingOrders: 0, totalOrders: 0 })
  const [financialStats, setFinancialStats] = useState<any>({
    income: 0,
    expenses: { 
      logistics: 0,
      marketing: 0,
      salaries: 0,
      rent: 0,
      total: 0 
    },
    profit: 0,
    returns: {
      count: 0,
      amount: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [salesTrends, setSalesTrends] = useState<{ name: string; sales: number }[]>([])
  const [previousMonthData, setPreviousMonthData] = useState<{
    ordersCount: number;
    returnsCount: number;
    income: number;
    averageOrderValue: number;
  }>({
    ordersCount: 0,
    returnsCount: 0,
    income: 0,
    averageOrderValue: 0
  })
  
  // Функция для расчета трендов (процентного изменения)
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    const change = ((current - previous) / previous) * 100
    return Number(change.toFixed(1))
  }
  
  // Форматирование валюты
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  }
  
  // Функция для отображения статусов
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100">Ожидает</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-100">Одобрен</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-100">Отклонен</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-100">Завершен</Badge>
      case 'open':
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 hover:bg-purple-100">Открыт</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-100">Закрыт</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Перевод статусов на русский
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает рассмотрения'
      case 'approved':
        return 'Одобрен'
      case 'rejected':
        return 'Отклонен'
      case 'completed':
        return 'Завершен'
      case 'processing':
        return 'В обработке'
      case 'open':
        return 'Открыт'
      case 'closed':
        return 'Закрыт'
      default:
        return status
    }
  }
  
  // Иконки для статусов
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <TimerOff className="h-4 w-4 text-red-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case 'open':
        return <Info className="h-4 w-4 text-purple-500" />
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }
  
  // Функция для перезагрузки данных
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Получаем текущий месяц и предыдущий месяц для анализа трендов
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      // Получаем предыдущий месяц
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      // Загружаем все данные параллельно для оптимизации
      const [
        returns, 
        defectsData, 
        currentMonthOrders, 
        currentMonthFinance, 
        previousMonthOrders,
        previousMonthFinance,
        salesHistoryData
      ] = await Promise.all([
        databaseService.getReturns().catch(() => []),
        databaseService.getDefects().catch(() => []),
        databaseService.getOrdersStats().catch(() => ({ 
          newOrders: 0, 
          processingOrders: 0, 
          totalOrders: 0 
        })),
        databaseService.getFinancialStatistics('month').catch(() => ({
          period: 'month',
          income: 0,
          expenses: { logistics: 0, marketing: 0, salaries: 0, rent: 0, total: 0 },
          profit: 0,
          returns: { count: 0, amount: 0 }
        })),
        // Получение статистики заказов за предыдущий месяц
        databaseService.getOrdersStatsForPeriod('previous-month').catch(() => ({ 
          newOrders: 0, 
          processingOrders: 0, 
          totalOrders: 0 
        })),
        databaseService.getFinancialStatistics('month', true).catch(() => ({
          period: 'previous-month',
          income: 0,
          expenses: { logistics: 0, marketing: 0, salaries: 0, rent: 0, total: 0 },
          profit: 0,
          returns: { count: 0, amount: 0 }
        })),
        // Получение исторических данных по продажам для графика
        generateSalesTrendsData() // Используем временную функцию, пока API не реализован
      ])
      
      // Устанавливаем данные только если они не null
      if (returns && returns.length > 0) {
        setRecentReturns(returns.slice(0, 5)) // Берем 5 последних возвратов
      }
      
      if (defectsData && defectsData.length > 0) {
        setDefects(defectsData)
      }
      
      if (currentMonthOrders) {
        setOrdersStats(currentMonthOrders)
      }
      
      if (currentMonthFinance) {
        setFinancialStats(currentMonthFinance)
      }
      
      // Сохраняем данные за предыдущий месяц для расчета трендов
      setPreviousMonthData({
        ordersCount: previousMonthOrders?.totalOrders || 0,
        returnsCount: previousMonthFinance?.returns?.count || 0,
        income: previousMonthFinance?.income || 0,
        averageOrderValue: previousMonthOrders?.totalOrders && previousMonthOrders.totalOrders > 0 
          ? previousMonthFinance?.income / previousMonthOrders?.totalOrders || 0 
          : 0
      })
      
      // Устанавливаем данные для графика продаж
      if (salesHistoryData && salesHistoryData.length > 0) {
        setSalesTrends(salesHistoryData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Временная функция для генерации трендов продаж, пока API не реализован
  function generateSalesTrendsData() {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    return months.map((name, i) => {
      const base = 40000 + i * 15000
      const random = Math.floor(Math.random() * 20000)
      return { name, sales: base + random }
    })
  }
  
  // Обработчик кнопки обновления
  const handleRefresh = () => {
    loadData()
  }
  
  // Загрузка данных при первом рендере
  useEffect(() => {
    loadData()
  }, [])
  
  // Расчет трендов на основе данных текущего и предыдущего месяца
  const trends = useMemo(() => {
    return {
      orders: calculateTrend(ordersStats.totalOrders, previousMonthData.ordersCount),
      returns: calculateTrend(financialStats.returns?.count || 0, previousMonthData.returnsCount),
      income: calculateTrend(financialStats.income, previousMonthData.income),
      averageCheck: calculateTrend(
        ordersStats.totalOrders > 0 ? financialStats.income / ordersStats.totalOrders : 0,
        previousMonthData.averageOrderValue
      )
    }
  }, [ordersStats, financialStats, previousMonthData])
  
  // Вычисляем статистику брака
  const defectsStats = useMemo(() => {
    if (!defects || defects.length === 0) {
      return { count: 0, totalItems: 0, cost: 0 }
    }
    
    // Общее количество записей о браке
    const count = defects.length
    
    // Общее количество бракованных единиц
    const totalItems = defects.reduce((sum, defect) => sum + defect.quantity, 0)
    
    // Примерная стоимость брака (в реальном приложении должна рассчитываться на сервере)
    // Для примера используем среднюю стоимость 2000 рублей за единицу
    const cost = totalItems * 2000
    
    return { count, totalItems, cost }
  }, [defects])
  
  // Вычисляем средний чек с защитой от ошибок
  const averageOrderValue = useMemo(() => {
    if (!financialStats || !ordersStats || !ordersStats.totalOrders) return 0
    return ordersStats.totalOrders > 0 ? financialStats.income / ordersStats.totalOrders : 0
  }, [financialStats, ordersStats])
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Link href="/crm/returns">
            <Button size="sm" variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Возвраты
            </Button>
          </Link>
          <Link href="/crm/orders">
            <Button size="sm" variant="outline">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Заказы
            </Button>
          </Link>
          <Link href="/crm/finances">
            <Button size="sm" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Финансы
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Активные заказы" 
              value={ordersStats.processingOrders.toString()}
              icon={<Package className="h-5 w-5 text-blue-500" />}
              description="Заказы в обработке"
              trend={trends.orders}
            />
            
            <StatCard 
              title="Возвраты" 
              value={financialStats.returns?.count?.toString() || "0"}
              icon={<RefreshCcw className="h-5 w-5 text-yellow-500" />}
              description="Количество возвратов"
              trend={trends.returns}
              color="yellow"
            />
            
            <StatCard 
              title="Оборот"
              value={formatCurrency(financialStats.income)}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              description="Общий объем продаж"
              trend={trends.income}
              color="green"
            />
            
            <StatCard 
              title="Средний чек" 
              value={formatCurrency(ordersStats.totalOrders > 0 ? financialStats.income / ordersStats.totalOrders : 0)}
              icon={<ShoppingBag className="h-5 w-5 text-purple-500" />}
              description="Средняя сумма заказа"
              trend={trends.averageCheck}
              color="purple"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="col-span-2 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Динамика продаж</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    За год
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrends}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value: number) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Продажи']}
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Последние возвраты</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recentReturns.length > 0 ? (
                  <div className="space-y-4">
                    {recentReturns.map(returnItem => (
                      <div 
                        key={returnItem.id} 
                        className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium line-clamp-1">{returnItem.product_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                              {returnItem.quantity} шт.
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">
                              {returnItem.return_reason || 'Причина не указана'}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className={`flex items-center gap-1 ${getStatusBadge(returnItem.status)}`}>
                          {getStatusIcon(returnItem.status)}
                          {translateStatus(returnItem.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <RefreshCcw className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    Нет недавних возвратов
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/crm/returns" className="w-full">
                  <Button variant="outline" className="w-full">
                    Все возвраты
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Статистика брака</span>
                  <Badge variant="outline" className="text-xs font-normal bg-red-100 text-red-800 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    За месяц
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Сводная информация по бракованной продукции
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/80 p-4 rounded-lg border border-red-100 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Всего случаев</div>
                      <div className="text-xl font-bold">{defectsStats.count} <span className="text-sm font-normal text-gray-500">записей</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-4 rounded-lg border border-red-100 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100 text-red-700">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Бракованных товаров</div>
                      <div className="text-xl font-bold">{defectsStats.totalItems} <span className="text-sm font-normal text-gray-500">шт.</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-4 rounded-lg border border-red-100 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100 text-red-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Примерный ущерб</div>
                      <div className="text-xl font-bold">{formatCurrency(defectsStats.cost)}</div>
                    </div>
                  </div>
                  
                  <Link href="/defects" className="w-full">
                    <Button variant="outline" className="w-full bg-white hover:bg-red-50">
                      Управление браком
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Быстрые ссылки</CardTitle>
                <CardDescription>Основные инструменты CRM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/crm/orders">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="h-6 w-6 text-blue-500" />
                      <span>Управление заказами</span>
                    </Button>
                  </Link>
                  <Link href="/crm/returns">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <RefreshCcw className="h-6 w-6 text-orange-500" />
                      <span>Управление возвратами</span>
                    </Button>
                  </Link>
                  <Link href="/defects">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                      <span>Управление браком</span>
                    </Button>
                  </Link>
                  <Link href="/crm/finances">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                      <span>Финансовая аналитика</span>
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2">
                      <BarChart3 className="h-6 w-6 text-purple-500" />
                      <span>Отчеты</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle>Финансовый отчет</CardTitle>
                <CardDescription>Показатели за текущий месяц</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-50">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <span>Общий доход</span>
                    </div>
                    <span className="font-bold">{formatCurrency(financialStats?.income || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-50">
                        <ShoppingBag className="h-5 w-5 text-blue-500" />
                      </div>
                      <span>Количество заказов</span>
                    </div>
                    <span className="font-bold">{ordersStats?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-50">
                        <Activity className="h-5 w-5 text-purple-500" />
                      </div>
                      <span>Средний чек</span>
                    </div>
                    <span className="font-bold">{formatCurrency(ordersStats.totalOrders > 0 ? financialStats.income / ordersStats.totalOrders : 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-50">
                        <RefreshCcw className="h-5 w-5 text-red-500" />
                      </div>
                      <span>Доход с возвратов</span>
                    </div>
                    <span className="font-bold text-red-500">-{formatCurrency(financialStats?.returns?.amount || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <span>Потери от брака</span>
                    </div>
                    <span className="font-bold text-red-500">-{formatCurrency(defectsStats.cost)}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link href="/crm/finances">
                    <Button variant="outline" className="w-full">
                      Подробная статистика
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default function CRMPage() {
  return (
    <AuthRoute>
      <CRMContent />
    </AuthRoute>
  )
} 