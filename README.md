# Labudin Sklad - Система управления складом и CRM

Веб-приложение для управления складом, заказами, возвратами и браком с интегрированной CRM-системой.

## Основные функции

- Управление заказами и товарами
- Обработка возвратов и брака
- CRM-панель для анализа данных
- Финансовая отчетность
- Генерация PDF-отчетов

## Технологии

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- PDF Make для отчетов
- Framer Motion для анимаций

## Установка и запуск

1. Клонировать репозиторий:
```bash
git clone https://github.com/SV190/e-commerce-with-crm.git
cd labudin-sklad
```

2. Установить зависимости:
```bash
npm install
```

3. Создать файл `.env.local` и добавить переменные окружения:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_API_STORAGE=true
```

4. Запустить разработческий сервер:
```bash
npm run dev
```

5. Открыть [http://localhost:3000](http://localhost:3000) в браузере.

## База данных

Проект использует Supabase для базы данных. Миграции SQL находятся в директории `/supabase/migrations`.

## Лицензия

MIT

## Автор

SV190
