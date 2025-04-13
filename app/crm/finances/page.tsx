"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthRoute } from "@/components/auth/AuthRoute"
import { databaseService } from "@/services/database"
import Link from "next/link"
import { 
  ChevronLeft, TrendingUp, TrendingDown, DollarSign, 
  AlertTriangle, RotateCcw, LineChart, PieChart, 
  FileBarChart, Download, Wallet, ShoppingCart 
} from "lucide-react"

interface FinancialStats {
  period: string
  income: number
  expenses: {
    defects: number
    returns: number
    total: number
  }
  profit: number
  ordersCount: number
  defectsCount: number
  returnsCount: number
}

function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend,
  className = ""
}: { 
  title: string, 
  value: number | string, 
  icon: React.ReactNode, 
  description?: string,
  trend?: 'up' | 'down' | 'neutral',
  className?: string
}) {
  return (
    <Card className={`overflow-hidden hover:shadow-md transition-all ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('ru-RU') + ' ₽' : value}</div>
        {description && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function FinancesContent() {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  
  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await databaseService.getFinancialStatistics(period)
      // Преобразуем данные в формат, который соответствует типу FinancialStats
      const formattedData: FinancialStats = {
        period: data.period,
        income: data.income,
        expenses: {
          defects: 0, // Устанавливаем значения по умолчанию
          returns: 0,
          total: data.expenses?.total || 0
        },
        profit: data.profit,
        ordersCount: data.returns?.count || 0,
        defectsCount: 0,
        returnsCount: data.returns?.count || 0
      }
      setStats(formattedData)
    } catch (error) {
      console.error("Ошибка при загрузке финансовой статистики:", error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadStats()
  }, [period])
  
  const handleRefresh = () => {
    loadStats()
  }

  // Преобразуем текущий период в удобочитаемый формат
  const getPeriodLabel = () => {
    const now = new Date();
    switch(period) {
      case 'day': return `за ${now.getDate()} ${getMonthName(now.getMonth())} ${now.getFullYear()}`;
      case 'week': return `за текущую неделю`;
      case 'month': return `за ${getMonthName(now.getMonth())} ${now.getFullYear()}`;
      case 'year': return `за ${now.getFullYear()} год`;
      default: return '';
    }
  }

  function getMonthName(month: number): string {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return months[month];
  }
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
        <p className="text-sm text-gray-500">Загружаем финансовую статистику...</p>
      </div>
    )
  }
  
  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Не удалось загрузить данные</h3>
        <p className="text-sm text-gray-500 mb-4">Произошла ошибка при получении финансовой статистики</p>
        <Button onClick={handleRefresh}>Попробовать снова</Button>
      </div>
    )
  }
  
  // Рассчитываем процент рентабельности
  const profitMargin = Math.round((stats.profit / (stats.income || 1)) * 100);
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Финансовая статистика</h1>
          <p className="text-gray-500">Доходы, расходы и прибыль {getPeriodLabel()}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft size={16} />
              Назад к CRM
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RotateCcw size={16} />
            Обновить
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Tabs defaultValue={period} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="day" onClick={() => setPeriod('day')}>День</TabsTrigger>
            <TabsTrigger value="week" onClick={() => setPeriod('week')}>Неделя</TabsTrigger>
            <TabsTrigger value="month" onClick={() => setPeriod('month')}>Месяц</TabsTrigger>
            <TabsTrigger value="year" onClick={() => setPeriod('year')}>Год</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Основные финансовые показатели */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Общий доход" 
            value={stats.income}
            icon={<DollarSign size={20} className="text-green-600" />}
            description={`${stats.ordersCount} выполненных заказов`}
            trend="up"
            className="border-l-4 border-l-green-500"
          />
          
          <StatCard 
            title="Расходы на брак" 
            value={stats.expenses.defects}
            icon={<AlertTriangle size={20} className="text-red-600" />}
            description={`${stats.defectsCount} позиций брака`}
            trend="down"
            className="border-l-4 border-l-red-500"
          />
          
          <StatCard 
            title="Расходы на возвраты" 
            value={stats.expenses.returns}
            icon={<RotateCcw size={20} className="text-amber-600" />}
            description={`${stats.returnsCount} возвратов`}
            trend="down"
            className="border-l-4 border-l-amber-500"
          />
          
          <StatCard 
            title="Чистая прибыль" 
            value={stats.profit}
            icon={<Wallet size={20} className={stats.profit >= 0 ? "text-blue-600" : "text-red-600"} />}
            description={`${Math.abs(profitMargin)}% рентабельность`}
            trend={stats.profit >= 0 ? "up" : "down"}
            className={`border-l-4 ${stats.profit >= 0 ? "border-l-blue-500" : "border-l-red-500"}`}
          />
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Визуализация структуры расходов */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Структура расходов</CardTitle>
                <CardDescription>Распределение расходов по категориям</CardDescription>
              </div>
              <PieChart size={24} className="text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative pt-4">
                <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                  {stats.expenses.total > 0 && (
                    <>
                      <div 
                        className="h-full bg-red-500 float-left flex items-center justify-center text-xs text-white font-medium" 
                        style={{ 
                          width: `${(stats.expenses.defects / stats.expenses.total) * 100}%`,
                          minWidth: stats.expenses.defects > 0 ? '40px' : '0'
                        }}
                      >
                        {stats.expenses.defects > 0 && Math.round((stats.expenses.defects / stats.expenses.total) * 100) > 10 && 
                          `${Math.round((stats.expenses.defects / stats.expenses.total) * 100)}%`
                        }
                      </div>
                      <div 
                        className="h-full bg-amber-500 float-left flex items-center justify-center text-xs text-white font-medium" 
                        style={{ 
                          width: `${(stats.expenses.returns / stats.expenses.total) * 100}%`,
                          minWidth: stats.expenses.returns > 0 ? '40px' : '0'
                        }}
                      >
                        {stats.expenses.returns > 0 && Math.round((stats.expenses.returns / stats.expenses.total) * 100) > 10 && 
                          `${Math.round((stats.expenses.returns / stats.expenses.total) * 100)}%`
                        }
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                    <div>
                      <p className="font-medium">Брак</p>
                      <p className="text-xs text-gray-500">{stats.expenses.defects.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
                    <div>
                      <p className="font-medium">Возвраты</p>
                      <p className="text-xs text-gray-500">{stats.expenses.returns.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <p className="text-sm font-medium">Детализация расходов</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Всего расходов:</span>
                    <span className="text-sm font-medium">{stats.expenses.total.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Доля брака:</span>
                    <span className="text-sm font-medium">
                      {stats.expenses.total > 0 
                        ? Math.round((stats.expenses.defects / stats.expenses.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Доля возвратов:</span>
                    <span className="text-sm font-medium">
                      {stats.expenses.total > 0 
                        ? Math.round((stats.expenses.returns / stats.expenses.total) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Сводка финансовых показателей */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Сводка показателей</CardTitle>
                <CardDescription>Основные финансовые метрики</CardDescription>
              </div>
              <FileBarChart size={24} className="text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Рентабельность</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${profitMargin >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {profitMargin}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full mt-2">
                  <div 
                    className={`h-full rounded-full ${profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {profitMargin >= 30 ? 'Превосходная' : 
                   profitMargin >= 20 ? 'Высокая' : 
                   profitMargin >= 10 ? 'Хорошая' : 
                   profitMargin >= 0 ? 'Низкая' : 'Отрицательная'} рентабельность
                </p>
              </div>

              <div className="border-t pt-5 mt-4">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-2">Доход от продаж</td>
                      <td className="text-right font-medium py-4 px-2">{stats.income.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-2">Расходы на брак</td>
                      <td className="text-right font-medium text-red-500 py-4 px-2">-{stats.expenses.defects.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-2">Расходы на возвраты</td>
                      <td className="text-right font-medium text-red-500 py-4 px-2">-{stats.expenses.returns.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-4 px-2 font-medium">Всего расходов</td>
                      <td className="text-right font-medium text-red-500 py-4 px-2">-{stats.expenses.total.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-2 font-bold">Чистая прибыль</td>
                      <td className={`text-right font-bold py-4 px-2 ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.profit.toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика заказов */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Статистика заказов</CardTitle>
              <CardDescription>Данные по заказам и возвратам</CardDescription>
            </div>
            <ShoppingCart size={24} className="text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Заказы</span>
                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{stats.ordersCount}</span>
              </div>
              <p className="text-xs text-blue-600">Выполненные заказы за период</p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-700">Возвраты</span>
                <span className="text-sm font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{stats.returnsCount}</span>
              </div>
              <p className="text-xs text-amber-600">Обработанные возвраты за период</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Дефекты</span>
                <span className="text-sm font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{stats.defectsCount}</span>
              </div>
              <p className="text-xs text-red-600">Зарегистрированные дефекты за период</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Кнопки экспорта отчётов */}
      <div className="flex flex-wrap gap-4 justify-end mt-4">
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Экспорт в PDF
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Экспорт в Excel
        </Button>
      </div>
    </div>
  )
}

export default function FinancesPage() {
  return (
    <AuthRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <FinancesContent />
        </div>
      </div>
    </AuthRoute>
  )
} 