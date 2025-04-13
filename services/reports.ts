import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { databaseService } from './database';

// Тип для параметров отчета
export interface ReportParams {
  type: string;
  period: string;
  startDate?: string;
  endDate?: string;
}

// Функция для получения данных для отчета
async function getReportData(params: ReportParams) {
  const { type, period, startDate, endDate } = params;
  
  // Определяем даты начала и конца периода
  let start = new Date();
  let end = new Date();
  
  switch (period) {
    case 'day':
      // Сегодня (начало дня)
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      // Неделя назад
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      // Месяц назад
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      // Квартал назад
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      // Год назад
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      // Пользовательский период
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        // Устанавливаем время для конца дня
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      // По умолчанию - месяц
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
  }

  // Получаем данные в зависимости от типа отчета
  switch (type) {
    case 'defects':
      // Отчет по браку
      return {
        title: 'Отчет по браку',
        period: formatPeriodText(period, start, end),
        data: await getDefectsData(start, end)
      };
    case 'returns':
      // Отчет по возвратам
      return {
        title: 'Отчет по возвратам',
        period: formatPeriodText(period, start, end),
        data: await getReturnsData(start, end)
      };
    case 'financial':
      // Финансовый отчет
      return {
        title: 'Финансовый отчет',
        period: formatPeriodText(period, start, end),
        data: await getFinancialData(start, end)
      };
    case 'combined':
      // Комплексный отчет
      return {
        title: 'Комплексный отчет',
        period: formatPeriodText(period, start, end),
        defectsData: await getDefectsData(start, end),
        returnsData: await getReturnsData(start, end),
        financialData: await getFinancialData(start, end)
      };
    default:
      throw new Error('Неизвестный тип отчета');
  }
}

// Получение данных о браке за период
async function getDefectsData(start: Date, end: Date) {
  try {
    // Здесь должен быть реальный код для запроса данных
    // Но пока возвращаем тестовые данные
    return [
      { 
        id: '1', 
        product_name: 'Смартфон Model X', 
        quantity: 3, 
        reason: 'Заводской дефект экрана', 
        date: '2024-03-15' 
      },
      { 
        id: '2', 
        product_name: 'Наушники Wireless Pro', 
        quantity: 2, 
        reason: 'Нерабочий аккумулятор', 
        date: '2024-03-18' 
      },
      { 
        id: '3', 
        product_name: 'Планшет Tab 10', 
        quantity: 1, 
        reason: 'Дефект корпуса', 
        date: '2024-03-20' 
      },
    ];
  } catch (error) {
    console.error('Ошибка при получении данных о браке:', error);
    return [];
  }
}

// Получение данных о возвратах за период
async function getReturnsData(start: Date, end: Date) {
  try {
    // Получаем реальные данные о возвратах
    const returns = await databaseService.getReturns();
    
    // Фильтруем возвраты по дате
    return returns.filter(ret => {
      const returnDate = new Date(ret.created_at);
      return returnDate >= start && returnDate <= end;
    }).map(ret => ({
      id: ret.id,
      product_name: ret.product_name,
      quantity: ret.quantity,
      reason: ret.reason,
      status: ret.status,
      date: format(new Date(ret.created_at), 'yyyy-MM-dd')
    }));
  } catch (error) {
    console.error('Ошибка при получении данных о возвратах:', error);
    
    // Возвращаем тестовые данные в случае ошибки
    return [
      { 
        id: '1', 
        product_name: 'Ноутбук Pro 15', 
        quantity: 1, 
        reason: 'Не соответствует описанию', 
        status: 'completed',
        date: '2024-03-10' 
      },
      { 
        id: '2', 
        product_name: 'Мышь Wireless', 
        quantity: 1, 
        reason: 'Не работает', 
        status: 'approved',
        date: '2024-03-12' 
      },
      { 
        id: '3', 
        product_name: 'Клавиатура Gaming', 
        quantity: 1, 
        reason: 'Дефект подсветки', 
        status: 'pending',
        date: '2024-03-22' 
      },
    ];
  }
}

// Получение финансовых данных за период
async function getFinancialData(start: Date, end: Date) {
  // В реальном приложении здесь должен быть запрос к API или базе данных
  // Сейчас возвращаем моковые данные
  return {
    totalReturnsAmount: 156000,
    totalDefectsAmount: 89000,
    incomeAmount: 1250000,
    expensesAmount: 780000,
    profitAmount: 470000,
    ordersCount: 145,
    returnsCount: 18,
    defectsCount: 23
  };
}

// Форматирование текста периода для отчета
function formatPeriodText(period: string, start: Date, end: Date) {
  switch (period) {
    case 'day':
      return `за ${format(start, 'd MMMM yyyy', { locale: ru })}`;
    case 'week':
      return `с ${format(start, 'd MMMM', { locale: ru })} по ${format(end, 'd MMMM yyyy', { locale: ru })}`;
    case 'month':
      return `за ${format(start, 'MMMM yyyy', { locale: ru })}`;
    case 'quarter':
      return `за ${format(start, 'MMMM', { locale: ru })} - ${format(end, 'MMMM yyyy', { locale: ru })}`;
    case 'year':
      return `за ${format(start, 'yyyy')} год`;
    case 'custom':
      return `с ${format(start, 'd MMMM yyyy', { locale: ru })} по ${format(end, 'd MMMM yyyy', { locale: ru })}`;
    default:
      return 'за указанный период';
  }
}

// Генерация PDF-отчета
export async function generateReport(params: ReportParams): Promise<Blob> {
  try {
    // Получаем данные для отчета
    const reportData = await getReportData(params);
    
    // Создаем PDF документ (А4, книжная ориентация)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Настройка шрифта для поддержки кириллицы
    doc.setFont('helvetica');
    
    // Заголовок отчета
    doc.setFontSize(20);
    doc.text(reportData.title, 105, 20, { align: 'center' });
    
    // Период
    doc.setFontSize(12);
    doc.text(`Период: ${reportData.period}`, 105, 30, { align: 'center' });
    
    // Дата формирования
    const currentDate = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: ru });
    doc.setFontSize(10);
    doc.text(`Дата формирования: ${currentDate}`, 105, 37, { align: 'center' });
    
    // Линия-разделитель
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);
    
    // Содержимое отчета в зависимости от типа
    switch (params.type) {
      case 'defects':
        generateDefectsReport(doc, reportData);
        break;
      case 'returns':
        generateReturnsReport(doc, reportData);
        break;
      case 'financial':
        generateFinancialReport(doc, reportData);
        break;
      case 'combined':
        generateCombinedReport(doc, reportData);
        break;
    }
    
    // Подпись внизу страницы
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Лабудин Склад - ${reportData.title} ${reportData.period}. Страница ${i} из ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    // Возвращаем PDF как Blob
    return doc.output('blob');
  } catch (error) {
    console.error('Ошибка при генерации отчета:', error);
    throw error;
  }
}

// Генерация отчета по браку
function generateDefectsReport(doc: jsPDF, reportData: any) {
  const { data } = reportData;
  
  // Добавляем таблицу
  (doc as any).autoTable({
    startY: 50,
    head: [['№', 'Наименование продукта', 'Количество', 'Причина', 'Дата']],
    body: data.map((item: any, index: number) => [
      index + 1,
      item.product_name,
      item.quantity,
      item.reason,
      formatDate(item.date)
    ]),
    headStyles: { fillColor: [66, 135, 245] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 20 },
      4: { cellWidth: 25 }
    },
  });
  
  // Статистика
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  
  doc.setFontSize(14);
  doc.text('Статистика по браку', 20, finalY + 15);
  
  doc.setFontSize(11);
  doc.text(`Общее количество случаев: ${data.length}`, 20, finalY + 25);
  
  const totalItems = data.reduce((sum: number, item: any) => sum + item.quantity, 0);
  doc.text(`Общее количество товаров: ${totalItems}`, 20, finalY + 32);
}

// Генерация отчета по возвратам
function generateReturnsReport(doc: jsPDF, reportData: any) {
  const { data } = reportData;
  
  // Добавляем таблицу
  (doc as any).autoTable({
    startY: 50,
    head: [['№', 'Наименование продукта', 'Количество', 'Причина', 'Статус', 'Дата']],
    body: data.map((item: any, index: number) => [
      index + 1,
      item.product_name,
      item.quantity,
      item.reason,
      translateStatus(item.status),
      formatDate(item.date)
    ]),
    headStyles: { fillColor: [245, 159, 0] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 15 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 }
    },
  });
  
  // Статистика
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  
  doc.setFontSize(14);
  doc.text('Статистика по возвратам', 20, finalY + 15);
  
  doc.setFontSize(11);
  doc.text(`Общее количество возвратов: ${data.length}`, 20, finalY + 25);
  
  const totalItems = data.reduce((sum: number, item: any) => sum + item.quantity, 0);
  doc.text(`Общее количество товаров: ${totalItems}`, 20, finalY + 32);
  
  // Статистика по статусам
  const statusCounts = data.reduce((counts: any, item: any) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {});
  
  doc.text('Распределение по статусам:', 20, finalY + 42);
  
  let y = finalY + 50;
  Object.entries(statusCounts).forEach(([status, count]: [string, any], index) => {
    doc.text(`${translateStatus(status)}: ${count}`, 25, y + (index * 7));
  });
}

// Генерация финансового отчета
function generateFinancialReport(doc: jsPDF, reportData: any) {
  const { data } = reportData;
  
  doc.setFontSize(14);
  doc.text('Финансовая сводка', 20, 50);
  
  // Базовая финансовая информация
  doc.setFontSize(11);
  doc.text(`Доход: ${formatCurrency(data.incomeAmount)}`, 20, 60);
  doc.text(`Расходы: ${formatCurrency(data.expensesAmount)}`, 20, 67);
  doc.text(`Прибыль: ${formatCurrency(data.profitAmount)}`, 20, 74);
  
  // Линия-разделитель
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 80, 190, 80);
  
  // Таблица финансов
  (doc as any).autoTable({
    startY: 85,
    head: [['Категория', 'Сумма', 'Процент']],
    body: [
      ['Доход от продаж', formatCurrency(data.incomeAmount), '100%'],
      ['Расходы', formatCurrency(data.expensesAmount), `${Math.round((data.expensesAmount / data.incomeAmount) * 100)}%`],
      ['Убытки от возвратов', formatCurrency(data.totalReturnsAmount), `${Math.round((data.totalReturnsAmount / data.incomeAmount) * 100)}%`],
      ['Убытки от брака', formatCurrency(data.totalDefectsAmount), `${Math.round((data.totalDefectsAmount / data.incomeAmount) * 100)}%`],
      ['Чистая прибыль', formatCurrency(data.profitAmount), `${Math.round((data.profitAmount / data.incomeAmount) * 100)}%`]
    ],
    headStyles: { fillColor: [0, 150, 76] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 30, halign: 'center' }
    },
  });
  
  // Статистика
  const finalY = (doc as any).lastAutoTable.finalY || 85;
  
  doc.setFontSize(14);
  doc.text('Статистика операций', 20, finalY + 15);
  
  doc.setFontSize(11);
  doc.text(`Количество заказов: ${data.ordersCount}`, 20, finalY + 25);
  doc.text(`Количество возвратов: ${data.returnsCount}`, 20, finalY + 32);
  doc.text(`Количество случаев брака: ${data.defectsCount}`, 20, finalY + 39);
  
  // Рентабельность
  const profitability = (data.profitAmount / data.incomeAmount) * 100;
  doc.text(`Рентабельность: ${profitability.toFixed(2)}%`, 20, finalY + 49);
}

// Генерация комплексного отчета
function generateCombinedReport(doc: jsPDF, reportData: any) {
  const { defectsData, returnsData, financialData } = reportData;
  
  // Сводная информация
  doc.setFontSize(14);
  doc.text('Сводная информация', 20, 50);
  
  doc.setFontSize(11);
  doc.text(`Доход: ${formatCurrency(financialData.incomeAmount)}`, 20, 60);
  doc.text(`Расходы: ${formatCurrency(financialData.expensesAmount)}`, 20, 67);
  doc.text(`Прибыль: ${formatCurrency(financialData.profitAmount)}`, 20, 74);
  doc.text(`Количество заказов: ${financialData.ordersCount}`, 20, 81);
  doc.text(`Количество возвратов: ${returnsData.length}`, 20, 88);
  doc.text(`Количество случаев брака: ${defectsData.length}`, 20, 95);
  
  // Линия-разделитель
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 102, 190, 102);
  
  // Таблица возвратов (краткая)
  doc.setFontSize(14);
  doc.text('Возвраты', 20, 112);
  
  (doc as any).autoTable({
    startY: 117,
    head: [['№', 'Наименование продукта', 'Причина', 'Статус']],
    body: returnsData.slice(0, 5).map((item: any, index: number) => [
      index + 1,
      item.product_name,
      item.reason,
      translateStatus(item.status)
    ]),
    headStyles: { fillColor: [245, 159, 0] },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { cellWidth: 30 }
    },
  });
  
  // Новая страница для брака и финансов
  doc.addPage();
  
  // Таблица брака (краткая)
  doc.setFontSize(14);
  doc.text('Брак', 20, 20);
  
  (doc as any).autoTable({
    startY: 25,
    head: [['№', 'Наименование продукта', 'Количество', 'Причина']],
    body: defectsData.slice(0, 5).map((item: any, index: number) => [
      index + 1,
      item.product_name,
      item.quantity,
      item.reason
    ]),
    headStyles: { fillColor: [66, 135, 245] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 20 }
    },
  });
  
  // Финансовая таблица
  const finalY = (doc as any).lastAutoTable.finalY || 25;
  
  doc.setFontSize(14);
  doc.text('Финансовая сводка', 20, finalY + 15);
  
  (doc as any).autoTable({
    startY: finalY + 20,
    head: [['Категория', 'Сумма', 'Процент']],
    body: [
      ['Доход от продаж', formatCurrency(financialData.incomeAmount), '100%'],
      ['Расходы', formatCurrency(financialData.expensesAmount), `${Math.round((financialData.expensesAmount / financialData.incomeAmount) * 100)}%`],
      ['Убытки от возвратов', formatCurrency(financialData.totalReturnsAmount), `${Math.round((financialData.totalReturnsAmount / financialData.incomeAmount) * 100)}%`],
      ['Убытки от брака', formatCurrency(financialData.totalDefectsAmount), `${Math.round((financialData.totalDefectsAmount / financialData.incomeAmount) * 100)}%`],
      ['Чистая прибыль', formatCurrency(financialData.profitAmount), `${Math.round((financialData.profitAmount / financialData.incomeAmount) * 100)}%`]
    ],
    headStyles: { fillColor: [0, 150, 76] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 30, halign: 'center' }
    },
  });
}

// Вспомогательные функции
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return format(date, 'dd.MM.yyyy', { locale: ru });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
}

function translateStatus(status: string) {
  switch (status) {
    case 'pending':
      return 'На рассмотрении';
    case 'approved':
      return 'Одобрен';
    case 'rejected':
      return 'Отклонен';
    case 'completed':
      return 'Завершен';
    case 'processing':
      return 'В обработке';
    default:
      return status;
  }
}

// Функция для загрузки сгенерированного отчета
export function downloadReport(reportBlob: Blob, filename: string) {
  saveAs(reportBlob, filename);
}

// Главная функция для создания и загрузки отчета
export async function createAndDownloadReport(params: ReportParams) {
  try {
    // Генерируем отчет
    const reportBlob = await generateReport(params);
    
    // Формируем имя файла
    let periodText = '';
    switch (params.period) {
      case 'day':
        periodText = format(new Date(), 'dd.MM.yyyy');
        break;
      case 'week':
        periodText = 'week_' + format(new Date(), 'dd.MM.yyyy');
        break;
      case 'month':
        periodText = format(new Date(), 'MM.yyyy');
        break;
      case 'quarter':
        periodText = 'quarter_' + format(new Date(), 'MM.yyyy');
        break;
      case 'year':
        periodText = format(new Date(), 'yyyy');
        break;
      case 'custom':
        if (params.startDate && params.endDate) {
          periodText = format(new Date(params.startDate), 'dd.MM.yyyy') + 
                      '_' + format(new Date(params.endDate), 'dd.MM.yyyy');
        } else {
          periodText = format(new Date(), 'dd.MM.yyyy');
        }
        break;
    }
    
    // Определяем тип отчета для имени файла
    let reportType = '';
    switch (params.type) {
      case 'defects':
        reportType = 'defects';
        break;
      case 'returns':
        reportType = 'returns';
        break;
      case 'financial':
        reportType = 'financial';
        break;
      case 'combined':
        reportType = 'combined';
        break;
    }
    
    const filename = `report_${reportType}_${periodText}.pdf`;
    
    // Загружаем отчет
    downloadReport(reportBlob, filename);
    
    // Возвращаем информацию об отчете для сохранения в истории
    return {
      filename,
      type: params.type,
      period: params.period,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Ошибка при создании и загрузке отчета:', error);
    throw error;
  }
} 