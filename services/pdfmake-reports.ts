import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { databaseService } from './database';
import { Defect, Return } from '@/types/supabase';

// Типы отчетов
export enum ReportType {
  DEFECTS = 'defects',
  RETURNS = 'returns',
  FINANCIAL = 'financial',
}

// Периоды
export enum PeriodType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

// Интерфейс параметров отчета
export interface ReportParams {
  type: ReportType;
  period: PeriodType;
  startDate?: Date;
  endDate?: Date;
}

// Интерфейсы данных отчетов
export interface DefectReportItem {
  code: string;
  name: string;
  count: number;
  percentage: string;
}

export interface ReturnReportItem {
  code: string;
  productName: string;
  reason: string;
  status: string;
  date: string;
}

export interface FinancialReportItem {
  category: string;
  amount: number;
  percentage: string;
}

export interface ReportData {
  title: string;
  dateRange: string;
  items: DefectReportItem[] | ReturnReportItem[] | FinancialReportItem[];
  summary: {
    [key: string]: string | number;
  };
}

// Форматирование даты
function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: ru });
}

// Получение диапазона дат для периода
function getDateRange(period: PeriodType, startDate?: Date, endDate?: Date): { start: Date; end: Date } {
  const today = new Date();
  let start = today;
  let end = today;

  switch (period) {
    case PeriodType.DAY:
      return { start: today, end: today };
    case PeriodType.WEEK:
      start = startOfWeek(today, { locale: ru });
      end = endOfWeek(today, { locale: ru });
      return { start, end };
    case PeriodType.MONTH:
      start = startOfMonth(today);
      end = endOfMonth(today);
      return { start, end };
    case PeriodType.QUARTER:
      const quarterStart = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), quarterStart, 1);
      end = new Date(today.getFullYear(), quarterStart + 3, 0);
      return { start, end };
    case PeriodType.YEAR:
      start = startOfYear(today);
      end = endOfYear(today);
      return { start, end };
    case PeriodType.CUSTOM:
      if (startDate && endDate) {
        return { start: startDate, end: endDate };
      }
      return { start: subDays(today, 30), end: today };
    default:
      return { start: today, end: today };
  }
}

// Получение заголовка отчета
function getReportTitle(type: ReportType, start: Date, end: Date): string {
  const dateRange = start === end
    ? `за ${formatDate(start)}`
    : `за период ${formatDate(start)} - ${formatDate(end)}`;

  switch (type) {
    case ReportType.DEFECTS:
      return `Отчет по дефектам ${dateRange}`;
    case ReportType.RETURNS:
      return `Отчет по возвратам ${dateRange}`;
    case ReportType.FINANCIAL:
      return `Финансовый отчет ${dateRange}`;
    default:
      return `Отчет ${dateRange}`;
  }
}

// Форматирование валюты
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
}

// Перевод статуса
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'В обработке',
    'approved': 'Одобрен',
    'rejected': 'Отклонен',
    'completed': 'Завершен',
    'processing': 'В обработке',
    'delivered': 'Доставлен',
    'shipped': 'Отправлен',
    'cancelled': 'Отменен',
    'returned': 'Возвращен'
  };
  return statusMap[status] || status;
}

// Фильтрация данных по дате
function filterDataByDateRange<T extends { created_at: string }>(data: T[], start: Date, end: Date): T[] {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return data.filter(item => {
    const itemDate = new Date(item.created_at);
    return itemDate.getTime() >= startTime && itemDate.getTime() <= endTime;
  });
}

// Генерация данных отчета по дефектам
async function generateDefectsReportData(start: Date, end: Date): Promise<ReportData> {
  // Получаем реальные данные о дефектах
  const allDefects = await databaseService.getDefects();
  
  // Фильтруем дефекты по дате
  const filteredDefects = filterDataByDateRange<Defect>(allDefects, start, end);
  
  // Группируем дефекты по типу
  const defectsByType = filteredDefects.reduce((acc, defect) => {
    const defectType = defect.defect_type || 'Не указан';
    if (!acc[defectType]) {
      acc[defectType] = {
        count: 0,
        quantity: 0
      };
    }
    acc[defectType].count += 1;
    acc[defectType].quantity += defect.quantity;
    return acc;
  }, {} as Record<string, { count: number, quantity: number }>);
  
  // Общее количество единиц брака
  const totalQuantity = filteredDefects.reduce((sum, defect) => sum + defect.quantity, 0);
  
  // Преобразуем данные в формат отчета
  const defectsData: DefectReportItem[] = Object.entries(defectsByType).map(([type, data], index) => ({
    code: `D${String(index + 1).padStart(3, '0')}`,
    name: type,
    count: data.quantity,
    percentage: totalQuantity > 0 ? `${Math.round((data.quantity / totalQuantity) * 100)}%` : '0%'
  }));

  return {
    title: 'Отчет по дефектам',
    dateRange: start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`,
    items: defectsData,
    summary: {
      totalDefects: totalQuantity,
      uniqueTypes: Object.keys(defectsByType).length,
      totalRecords: filteredDefects.length
    }
  };
}

// Генерация данных отчета по возвратам
async function generateReturnsReportData(start: Date, end: Date): Promise<ReportData> {
  // Получаем реальные данные о возвратах
  const allReturns = await databaseService.getReturns();
  
  // Фильтруем возвраты по дате
  const filteredReturns = filterDataByDateRange<Return>(allReturns, start, end);
  
  // Статистика по статусам
  const statusCount = filteredReturns.reduce((acc, ret) => {
    const status = ret.status || 'Не указан';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Формируем список возвратов
  const returnsData: ReturnReportItem[] = filteredReturns.map((ret, index) => ({
    code: `R${String(index + 1).padStart(3, '0')}`,
    productName: ret.product_name || 'Неизвестный товар',
    reason: ret.return_reason || ret.reason || 'Не указана',
    status: translateStatus(ret.status || 'pending'),
    date: formatDate(new Date(ret.created_at))
  }));

  return {
    title: 'Отчет по возвратам',
    dateRange: start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`,
    items: returnsData,
    summary: {
      ...Object.keys(statusCount).reduce((acc, status) => {
        acc[translateStatus(status)] = statusCount[status];
        return acc;
      }, {} as Record<string, number>),
      totalReturns: filteredReturns.length,
      totalQuantity: filteredReturns.reduce((sum, ret) => sum + ret.quantity, 0)
    }
  };
}

// Генерация данных финансового отчета
async function generateFinancialReportData(start: Date, end: Date): Promise<ReportData> {
  // Получаем финансовую статистику
  // Преобразуем период в формат, который использует getFinancialStatistics
  let periodType: 'day' | 'week' | 'month' | 'year' = 'month';
  
  // Приведение периода к формату, ожидаемому сервисом
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (start.getTime() === startOfDay.getTime() && end.getTime() === startOfDay.getTime()) {
    periodType = 'day';
  } else if (start.getTime() === startOfWeek(today, { locale: ru }).getTime() && 
             end.getTime() === endOfWeek(today, { locale: ru }).getTime()) {
    periodType = 'week';
  } else if (start.getTime() === startOfMonth(today).getTime() && 
             end.getTime() === endOfMonth(today).getTime()) {
    periodType = 'month';
  } else if (start.getTime() === startOfYear(today).getTime() && 
             end.getTime() === endOfYear(today).getTime()) {
    periodType = 'year';
  }
  
  const financialStats = await databaseService.getFinancialStatistics(periodType);
  
  // Формируем данные для отчета
  const financialData: FinancialReportItem[] = [
    { 
      category: 'Доходы от заказов', 
      amount: financialStats.income, 
      percentage: financialStats.income ? '100%' : '0%' 
    },
    { 
      category: 'Расходы на возвраты', 
      amount: -financialStats.expenses.returns, 
      percentage: financialStats.income ? 
        `-${Math.round((financialStats.expenses.returns / financialStats.income) * 100)}%` : '0%' 
    },
    { 
      category: 'Расходы на брак', 
      amount: -financialStats.expenses.defects, 
      percentage: financialStats.income ? 
        `-${Math.round((financialStats.expenses.defects / financialStats.income) * 100)}%` : '0%' 
    }
  ];

  // Если у нас есть дополнительные категории расходов, добавляем их
  if (financialStats.expenses.total > financialStats.expenses.returns + financialStats.expenses.defects) {
    const otherExpenses = financialStats.expenses.total - financialStats.expenses.returns - financialStats.expenses.defects;
    financialData.push({
      category: 'Прочие расходы',
      amount: -otherExpenses,
      percentage: financialStats.income ? 
        `-${Math.round((otherExpenses / financialStats.income) * 100)}%` : '0%'
    });
  }

  return {
    title: 'Финансовый отчет',
    dateRange: start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`,
    items: financialData,
    summary: {
      totalIncome: formatCurrency(financialStats.income),
      totalExpenses: formatCurrency(financialStats.expenses.total),
      netProfit: formatCurrency(financialStats.profit),
      ordersCount: financialStats.ordersCount,
      defectsCount: financialStats.defectsCount,
      returnsCount: financialStats.returnsCount
    }
  };
}

// Основная функция для генерации данных отчета
export async function generateReport(params: ReportParams): Promise<ReportData> {
  try {
    console.log('Начинаем формирование отчета с параметрами:', params);
    
    // Получение диапазона дат на основе параметров
    const { start, end } = getDateRange(params.period, params.startDate, params.endDate);
    
    console.log('Диапазон дат для отчета:', { start, end });
    
    // Выбор соответствующего генератора данных отчета
    let reportData: ReportData;
    
    switch (params.type) {
      case ReportType.DEFECTS:
        reportData = await generateDefectsReportData(start, end);
        break;
      case ReportType.RETURNS:
        reportData = await generateReturnsReportData(start, end);
        break;
      case ReportType.FINANCIAL:
        reportData = await generateFinancialReportData(start, end);
        break;
      default:
        throw new Error(`Неизвестный тип отчета: ${params.type}`);
    }
    
    console.log('Отчет успешно сформирован');
    return reportData;
  } catch (error) {
    console.error('Ошибка при генерации отчета:', error);
    throw error;
  }
} 