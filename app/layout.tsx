import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { CartProvider } from '@/components/CartContext'
import { Navbar } from '@/components/layout/Navbar'
import { createTables, checkRPCAvailability } from '@/lib/supabase-admin'
import { checkTablesExist, checkSupabaseConnection } from '@/lib/supabase'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

// Инициализируем таблицы при запуске приложения (только на клиенте)
if (typeof window !== 'undefined') {
  // Используем setTimeout, чтобы не блокировать рендеринг
  setTimeout(async () => {
    try {
      // Проверка соединения с Supabase
      console.log('Проверка соединения с Supabase...')
      const connectionStatus = await checkSupabaseConnection()
      
      if (!connectionStatus.connected) {
        console.error('Ошибка соединения с Supabase!')
        console.error('Проверьте подключение к интернету и доступность сервиса Supabase.')
        console.error('Приложение продолжит работу в автономном режиме.')
        return
      }
      
      // Проверка таблиц в базе данных
      await checkTablesExist()
      
      console.log('Проверка доступности RPC функций...')
      const rpcStatus = await checkRPCAvailability()
      
      if (!rpcStatus.exec_sql) {
        console.warn('Функция exec_sql недоступна в вашем проекте Supabase.')
        console.warn('Для создания необходимых таблиц перейдите в SQL-редактор в панели Supabase.')
        console.warn('Необходимо вручную создать таблицы user_carts, user_favorites, orders и order_items.')
      } else {
        // Создаем таблицы, если у нас есть доступ к функции exec_sql
        await createTables().catch(console.error)
      }
    } catch (error) {
      console.error('Ошибка при инициализации таблиц:', error)
    }
  }, 1000)
}

export const metadata: Metadata = {
  title: 'Лабудин Стор - Надежный поставщик',
  description: 'Лабудин Стор - широкий выбор товаров с доставкой по всей России',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <footer className="bg-gray-800 text-white py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">О компании</h3>
                    <p className="text-gray-300">Лабудин Склад - современная система управления складом и интернет-магазин с широким ассортиментом товаров.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Информация</h3>
                    <ul className="space-y-2">
                      <li><a href="/about" className="text-gray-300 hover:text-white">О нас</a></li>
                      <li><a href="/delivery" className="text-gray-300 hover:text-white">Доставка</a></li>
                      <li><a href="/payment" className="text-gray-300 hover:text-white">Оплата</a></li>
                      <li><a href="/contacts" className="text-gray-300 hover:text-white">Контакты</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Покупателям</h3>
                    <ul className="space-y-2">
                      <li><a href="/profile" className="text-gray-300 hover:text-white">Личный кабинет</a></li>
                      <li><a href="/profile?tab=orders" className="text-gray-300 hover:text-white">Заказы</a></li>
                      <li><a href="/cart" className="text-gray-300 hover:text-white">Корзина</a></li>
                      <li><a href="/wishlist" className="text-gray-300 hover:text-white">Избранное</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Контакты</h3>
                    <p className="text-gray-300">Телефон: +7 (123) 456-78-90</p>
                    <p className="text-gray-300">Email: info@labudin-sklad.ru</p>
                    <p className="text-gray-300">Адрес: г. Москва, ул. Примерная, д. 123</p>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
                  <p>© {new Date().getFullYear()} Лабудин Склад. Все права защищены.</p>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
