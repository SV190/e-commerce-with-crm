import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Return } from '@/types/supabase'

interface ReturnsTableProps {
  returns: Return[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-500 hover:bg-green-600"
    case "processing":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "pending":
      return "bg-orange-500 hover:bg-orange-600"
    case "rejected":
      return "bg-red-500 hover:bg-red-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

const ReturnsTable: React.FC<ReturnsTableProps> = ({ returns }) => {
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

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4">История возвратов</h3>
      {returns.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">У вас пока нет возвратов</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">№ заказа</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.order_id.slice(0, 8)}</TableCell>
                  <TableCell>{returnItem.product_name}</TableCell>
                  <TableCell>{formatDate(returnItem.created_at)}</TableCell>
                  <TableCell>{returnItem.reason}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(returnItem.status)}>
                      {returnItem.status === "approved" && "Одобрен"}
                      {returnItem.status === "processing" && "В обработке"}
                      {returnItem.status === "pending" && "На рассмотрении"}
                      {returnItem.status === "rejected" && "Отклонен"}
                    </Badge>
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

export default ReturnsTable 