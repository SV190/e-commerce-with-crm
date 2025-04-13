import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Order } from '@/types/supabase'
import { useRouter } from 'next/navigation'

interface OrdersTableProps {
  orders: Order[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-500 hover:bg-green-600"
    case "shipped":
      return "bg-blue-500 hover:bg-blue-600"
    case "processing":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "pending":
      return "bg-orange-500 hover:bg-orange-600"
    case "canceled":
      return "bg-red-500 hover:bg-red-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  const router = useRouter()

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4">История заказов</h3>
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">У вас пока нет заказов</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">№ заказа</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status === "delivered" && "Доставлен"}
                      {order.status === "shipped" && "Отправлен"}
                      {order.status === "processing" && "В обработке"}
                      {order.status === "pending" && "Ожидает"}
                      {order.status === "canceled" && "Отменен"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2">
                      Детали
                    </Button>
                    {(order.status === "delivered" || order.status === "shipped") && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => router.push(`/returns/create?orderId=${order.id}`)}
                      >
                        Возврат
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default OrdersTable 