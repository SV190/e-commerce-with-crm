"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, BarChart2, RefreshCcw, TrendingUp, Calendar, FileText, Clock, ChevronLeft, Table, LineChart, Eye, Filter } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"
import { generateReport, ReportType, PeriodType, ReportData, DefectReportItem, ReturnReportItem, FinancialReportItem } from "@/services/pdfmake-reports"
import { databaseService } from "@/services/database"

// Интерфейс для финансовой статистики
interface FinancialStats {
  period: string;
  income: number;
  expenses: {
    defects: number;
    returns: number;
    total: number;
  };
  profit: number;
  defectsCount: number;
  returnsCount: number;
}

// Интерфейс для статистики дефектов
interface DefectsStats {
  total: number;
  thisMonth: number;
  average: number;
}

// Интерфейс для статистики возвратов
interface ReturnsStats {
  total: number;
  thisMonth: number;
  average: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodType>(PeriodType.MONTH)
  const [reportType, setReportType] = useState<ReportType | "">("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [reportVisible, setReportVisible] = useState(false)
  
  // Состояния для реальных данных
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null)
  const [defectsStats, setDefectsStats] = useState<DefectsStats | null>(null)
  const [returnsStats, setReturnsStats] = useState<ReturnsStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    async function loadStatistics() {
      try {
        setLoadingStats(true)
        
        // Параллельная загрузка всех типов статистики
        const [finance, defects, returns] = await Promise.all([
          databaseService.getFinancialStatistics('month'),
          databaseService.getDefectsStatistics(),
          databaseService.getReturnsStatistics()
        ])
        
        // Адаптируем структуру данных к нашему интерфейсу FinancialStats
        const adaptedFinance: FinancialStats = {
          period: finance.period,
          income: finance.income,
          expenses: {
            defects: finance.expenses.logistics + finance.expenses.marketing, // Используем существующие данные в качестве заглушки
            returns: finance.expenses.salaries + finance.expenses.rent, // Используем существующие данные в качестве заглушки
            total: finance.expenses.total
          },
          profit: finance.profit,
          defectsCount: defects.total,
          returnsCount: returns.total
        };
        
        setFinancialStats(adaptedFinance);
        setDefectsStats(defects);
        setReturnsStats(returns);
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    
    loadStatistics()
  }, [])

  const handleGenerateReport = async () => {
    if (!reportType) {
      alert("Выберите тип отчета");
      return
    }
    
    try {
      setLoading(true)
      
      // Конвертируем строковые даты в объекты Date если выбран период "custom"
      const startDateObj = period === PeriodType.CUSTOM && startDate ? new Date(startDate) : undefined
      const endDateObj = period === PeriodType.CUSTOM && endDate ? new Date(endDate) : undefined
      
      console.log('Запуск формирования отчета с параметрами:', {
        type: reportType,
        period,
        startDate: startDateObj,
        endDate: endDateObj
      })
      
      // Вызываем сервис для генерации отчета
      const data = await generateReport({
        type: reportType as ReportType,
        period,
        startDate: startDateObj,
        endDate: endDateObj
      })
      
      setReportData(data)
      setReportVisible(true)
    } catch (error) {
      console.error('Ошибка при формировании отчета:', error)
      alert("Не удалось сформировать отчет. Проверьте консоль разработчика.");
    } finally {
      setLoading(false)
    }
  }

  const handleCloseReport = () => {
    setReportVisible(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount)
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/crm">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Назад к CRM
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Отчеты и аналитика</h1>
        <p className="text-muted-foreground">
          Формирование и анализ отчётов по работе склада
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-700">Статистика брака</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <BarChart2 className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Всего случаев</span>
                    <span className="font-medium text-blue-800">{defectsStats?.total || 0}</span>
                  </div>
                  <Progress value={75} className="h-2 bg-blue-100" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">За текущий месяц</span>
                    <div className="flex items-center gap-1">
                      {defectsStats && defectsStats.total > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`${
                            defectsStats.thisMonth > defectsStats.total / 12
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-green-50 text-green-700 border-green-100"
                          }`}
                        >
                          {defectsStats.thisMonth > defectsStats.total / 12 ? "+" : "-"}
                          {Math.round(defectsStats.thisMonth / (defectsStats.total / 12) * 100 - 100)}%
                        </Badge>
                      )}
                      <span className="font-medium text-blue-800">{defectsStats?.thisMonth || 0}</span>
                    </div>
                  </div>
                  <Progress 
                    value={defectsStats?.total ? (defectsStats.thisMonth / defectsStats.total) * 100 : 0} 
                    className="h-2 bg-blue-100" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Среднее количество</span>
                    <span className="font-medium text-blue-800">{defectsStats?.average || 0} шт.</span>
                  </div>
                  <Progress 
                    value={defectsStats?.average && defectsStats.total ? (defectsStats.average / defectsStats.total) * 100 : 0} 
                    className="h-2 bg-blue-100" 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-700">Статистика возвратов</CardTitle>
              <div className="p-2 rounded-full bg-amber-100">
                <RefreshCcw className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Всего случаев</span>
                    <span className="font-medium text-amber-800">{returnsStats?.total || 0}</span>
                  </div>
                  <Progress 
                    value={returnsStats?.total ? 100 : 0} 
                    className="h-2 bg-amber-100" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">За текущий месяц</span>
                    <div className="flex items-center gap-1">
                      {returnsStats && returnsStats.total > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`${
                            returnsStats.thisMonth > returnsStats.total / 12
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-green-50 text-green-700 border-green-100"
                          }`}
                        >
                          {returnsStats.thisMonth > returnsStats.total / 12 ? "+" : "-"}
                          {Math.round(Math.abs(returnsStats.thisMonth / (returnsStats.total / 12) * 100 - 100))}%
                        </Badge>
                      )}
                      <span className="font-medium text-amber-800">{returnsStats?.thisMonth || 0}</span>
                    </div>
                  </div>
                  <Progress 
                    value={returnsStats?.total ? (returnsStats.thisMonth / returnsStats.total) * 100 : 0} 
                    className="h-2 bg-amber-100" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Среднее количество</span>
                    <span className="font-medium text-amber-800">{returnsStats?.average || 0} шт.</span>
                  </div>
                  <Progress 
                    value={returnsStats?.average && returnsStats.total ? (returnsStats.average / returnsStats.total) * 100 : 0} 
                    className="h-2 bg-amber-100" 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700">Экономический ущерб</CardTitle>
              <div className="p-2 rounded-full bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Убытки от брака</span>
                    <span className="font-medium text-green-800">
                      {financialStats ? formatCurrency(financialStats.expenses.defects) : '₽ 0'}
                    </span>
                  </div>
                  <Progress 
                    value={financialStats?.expenses.total ? (financialStats.expenses.defects / financialStats.expenses.total) * 100 : 0} 
                    className="h-2 bg-green-100" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Убытки от возвратов</span>
                    <span className="font-medium text-green-800">
                      {financialStats ? formatCurrency(financialStats.expenses.returns) : '₽ 0'}
                    </span>
                  </div>
                  <Progress 
                    value={financialStats?.expenses.total ? (financialStats.expenses.returns / financialStats.expenses.total) * 100 : 0} 
                    className="h-2 bg-green-100" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Общий убыток</span>
                    <Badge 
                      variant="outline" 
                      className={`bg-red-50 text-red-700 border-red-100`}
                    >
                      {financialStats?.income && financialStats.income > 0 
                        ? `-${Math.round((financialStats.expenses.total / financialStats.income) * 100)}%` 
                        : '-0%'}
                    </Badge>
                  </div>
                  <Progress 
                    value={financialStats?.expenses.total && financialStats.income 
                      ? Math.min((financialStats.expenses.total / financialStats.income) * 100, 100) 
                      : 0} 
                    className="h-2 bg-green-100" 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {reportVisible && reportData ? (
        <Card className="mb-8">
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <div>
              <CardTitle>{reportData.title}</CardTitle>
              <CardDescription>
                Период: {reportData.dateRange}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleCloseReport} size="sm">
              Закрыть отчет
            </Button>
          </CardHeader>
          <CardContent>
            {reportType === ReportType.DEFECTS && (
              <DefectsReport data={reportData} />
            )}
            {reportType === ReportType.RETURNS && (
              <ReturnsReport data={reportData} />
            )}
            {reportType === ReportType.FINANCIAL && (
              <FinancialReport data={reportData} />
            )}
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="generate">Генерация отчетов</TabsTrigger>
          <TabsTrigger value="recent">Недавние отчеты</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Генерация отчетов</CardTitle>
              <CardDescription>
                Выберите параметры для формирования отчета
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Тип отчета</Label>
                    <Select 
                      value={reportType} 
                      onValueChange={(value) => setReportType(value as ReportType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип отчета" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReportType.DEFECTS}>Отчет по браку</SelectItem>
                        <SelectItem value={ReportType.RETURNS}>Отчет по возвратам</SelectItem>
                        <SelectItem value={ReportType.FINANCIAL}>Финансовый отчет</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Период</Label>
                    <Select 
                      value={period}
                      onValueChange={(value) => setPeriod(value as PeriodType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите период" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PeriodType.DAY}>За день</SelectItem>
                        <SelectItem value={PeriodType.WEEK}>За неделю</SelectItem>
                        <SelectItem value={PeriodType.MONTH}>За месяц</SelectItem>
                        <SelectItem value={PeriodType.QUARTER}>За квартал</SelectItem>
                        <SelectItem value={PeriodType.YEAR}>За год</SelectItem>
                        <SelectItem value={PeriodType.CUSTOM}>Произвольный период</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {period === PeriodType.CUSTOM && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Дата начала</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дата окончания</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      Отчеты формируются непосредственно на странице и содержат полную статистику по выбранным параметрам.
                      Вы можете просмотреть отчет сразу после его формирования.
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={handleGenerateReport}
                  disabled={loading || (!reportType || (period === PeriodType.CUSTOM && (!startDate || !endDate)))}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Формирование отчета...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Сформировать отчет
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Недавние отчеты</CardTitle>
              <CardDescription>
                История сформированных отчетов за последнее время
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-medium">Отчет по браку</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            <Calendar className="h-3 w-3 mr-1" />
                            Март 2024
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            01.04.2024 10:00
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Просмотреть
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-medium">Финансовый отчет</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            <Calendar className="h-3 w-3 mr-1" />
                            Q1 2024
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            31.03.2024 18:30
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Просмотреть
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-medium">Отчет по возвратам</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                            <Calendar className="h-3 w-3 mr-1" />
                            Февраль 2024
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            01.03.2024 09:15
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Просмотреть
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Компонент отчета по дефектам
function DefectsReport({ data }: { data: ReportData }) {
  const items = data.items as DefectReportItem[];
  
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left">Код дефекта</th>
              <th className="border p-2 text-left">Наименование</th>
              <th className="border p-2 text-right">Количество</th>
              <th className="border p-2 text-right">Процент от общего</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                <td className="border p-2">{item.code}</td>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2 text-right">{item.count}</td>
                <td className="border p-2 text-right">{item.percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Итоги:</h3>
        <p className="text-blue-800">Общее количество дефектов: <span className="font-bold">{data.summary.totalDefects}</span></p>
      </div>
    </div>
  )
}

// Компонент отчета по возвратам
function ReturnsReport({ data }: { data: ReportData }) {
  const items = data.items as ReturnReportItem[];
  
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left">Код возврата</th>
              <th className="border p-2 text-left">Товар</th>
              <th className="border p-2 text-left">Причина</th>
              <th className="border p-2 text-left">Статус</th>
              <th className="border p-2 text-left">Дата</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                <td className="border p-2">{item.code}</td>
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2">{item.reason}</td>
                <td className="border p-2">{item.status}</td>
                <td className="border p-2">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-50 rounded-lg">
          <h3 className="font-medium text-amber-900 mb-2">Статистика по статусам:</h3>
          <div className="space-y-1">
            {Object.entries(data.summary)
              .filter(([key]) => key !== 'totalReturns')
              .map(([status, count], index) => (
                <p key={index} className="text-amber-800">{status}: <span className="font-bold">{count}</span></p>
              ))}
          </div>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg">
          <h3 className="font-medium text-amber-900 mb-2">Итоги:</h3>
          <p className="text-amber-800">Общее количество возвратов: <span className="font-bold">{data.summary.totalReturns}</span></p>
        </div>
      </div>
    </div>
  )
}

// Компонент финансового отчета
function FinancialReport({ data }: { data: ReportData }) {
  const items = data.items as FinancialReportItem[];
  
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left">Категория</th>
              <th className="border p-2 text-right">Сумма</th>
              <th className="border p-2 text-right">Процент</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                <td className="border p-2">{item.category}</td>
                <td className="border p-2 text-right">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(item.amount)}</td>
                <td className="border p-2 text-right">{item.percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">Итоги:</h3>
        <div className="space-y-1">
          <p className="text-green-800">Доход: <span className="font-bold">{data.summary.totalIncome}</span></p>
          <p className="text-green-800">Расходы: <span className="font-bold">{data.summary.totalExpenses}</span></p>
          <p className="text-green-800 text-lg mt-2">Чистая прибыль: <span className="font-bold">{data.summary.netProfit}</span></p>
        </div>
      </div>
    </div>
  )
}

// Label component for form fields
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  )
} 