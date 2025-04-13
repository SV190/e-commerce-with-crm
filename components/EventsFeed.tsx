'use client'

import { useState, useEffect } from 'react'
import { databaseService } from '@/services/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Event = {
  id: string
  type: 'defect' | 'return'
  title: string
  description: string
  created_at: string
  status: string
}

export function EventsFeed() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await databaseService.getRecentEvents()
      setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'closed':
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'Новый'
      case 'open':
        return 'Открыт'
      case 'closed':
        return 'Закрыт'
      case 'pending':
        return 'На рассмотрении'
      case 'approved':
        return 'Одобрен'
      case 'rejected':
        return 'Отклонен'
      case 'completed':
        return 'Завершен'
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние события</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Нет событий</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                    {getStatusText(event.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 