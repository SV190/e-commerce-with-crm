import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CustomImage } from '@/components/CustomImage'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-6">О компании Лабудин Склад</h1>
        <p className="text-xl text-gray-600">
          Мы делаем управление складом и электронную коммерцию простыми и эффективными
        </p>
      </div>

      {/* История компании */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="text-3xl font-bold mb-6">Наша история</h2>
          <div className="space-y-4">
            <p>
              Компания "Лабудин Склад" была основана в 2020 году группой энтузиастов, стремящихся 
              решить проблемы управления складскими запасами для малого и среднего бизнеса.
            </p>
            <p>
              Начав с небольшого офиса в Москве, мы быстро выросли и теперь обслуживаем
              клиентов по всей России. Наша платформа объединяет в себе систему 
              управления складом и интернет-магазин, что позволяет нашим клиентам 
              эффективно управлять своими товарами и увеличивать продажи.
            </p>
            <p>
              За короткое время мы заработали репутацию надежного партнера, 
              который предлагает инновационные решения и высококачественные товары.
            </p>
          </div>
        </div>
        <div className="relative h-80 rounded-xl overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2070&auto=format&fit=crop"
            alt="История компании"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Наша миссия */}
      <div className="bg-blue-50 rounded-2xl p-12 mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Наша миссия</h2>
          <p className="text-xl">
            Мы стремимся сделать управление товарами и продажами максимально 
            простыми и эффективными для наших клиентов, предоставляя современные 
            технологические решения и высококачественные товары по доступным ценам.
          </p>
        </div>
      </div>

      {/* Наша команда */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Наша команда</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Александр Лабудин',
              position: 'Генеральный директор',
              bio: 'Основатель компании с более чем 10-летним опытом в логистике и управлении цепочками поставок.',
              image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop'
            },
            {
              name: 'Екатерина Смирнова',
              position: 'Технический директор',
              bio: 'Отвечает за разработку и поддержку нашей платформы. Эксперт в области веб-разработки и UX/UI дизайна.',
              image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop'
            },
            {
              name: 'Михаил Петров',
              position: 'Директор по маркетингу',
              bio: 'Специалист с богатым опытом в цифровом маркетинге и развитии бренда. Отвечает за привлечение новых клиентов.',
              image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=500&auto=format&fit=crop'
            }
          ].map((member, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-64 relative">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover" 
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-blue-600 mb-3">{member.position}</p>
                <p className="text-gray-600">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Наши преимущества */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Наши преимущества</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Качество продукции',
              description: 'Мы тщательно отбираем товары, которые представлены в нашем каталоге, чтобы гарантировать их высокое качество.',
              icon: '🏆'
            },
            {
              title: 'Быстрая доставка',
              description: 'Наша логистическая система обеспечивает оперативную доставку заказов в любую точку России.',
              icon: '🚚'
            },
            {
              title: 'Поддержка клиентов',
              description: 'Наша команда поддержки всегда готова помочь вам с любыми вопросами по заказам и товарам.',
              icon: '💬'
            },
            {
              title: 'Гибкие цены',
              description: 'Мы предлагаем конкурентные цены и регулярно проводим выгодные акции и распродажи.',
              icon: '💰'
            },
            {
              title: 'Удобная платформа',
              description: 'Наш интернет-магазин и система управления складом созданы с учетом пожеланий пользователей.',
              icon: '💻'
            },
            {
              title: 'Экологичность',
              description: 'Мы заботимся о природе и стремимся минимизировать наше воздействие на окружающую среду.',
              icon: '🌱'
            }
          ].map((advantage, index) => (
            <Card key={index} className="p-6">
              <div className="text-5xl mb-4">{advantage.icon}</div>
              <h3 className="text-xl font-bold mb-2">{advantage.title}</h3>
              <p className="text-gray-600">{advantage.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Контакты */}
      <div className="bg-gray-50 rounded-2xl p-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Связаться с нами</h2>
          <p className="mb-8">
            Если у вас есть вопросы или предложения, мы всегда рады вам помочь. 
            Свяжитесь с нами удобным для вас способом.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold mb-2">Адрес</h3>
              <p>г. Москва, ул. Примерная, д. 123</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Телефон</h3>
              <p>+7 (123) 456-78-90</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Email</h3>
              <p>info@labudin-sklad.ru</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 