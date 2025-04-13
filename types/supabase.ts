export interface Defect {
  id: string
  created_at: string
  product_name: string
  quantity: number
  defect_type: 'production' | 'material' | 'equipment' | 'other'
  description: string
  status: 'open' | 'closed'
  user_id: string
  product_id?: string | null
  product_article?: string | null
}

export interface Return {
  id: string
  order_id: string
  user_id: string
  product_id: string
  product_name: string
  quantity: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'processing'
  created_at: string
  updated_at?: string
  description?: string
  return_reason?: string
  images?: string[]
}

export interface Report {
  id: string
  created_at: string
  report_type: 'defects' | 'returns' | 'financial' | 'combined'
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  start_date: string
  end_date: string
  file_url: string
  user_id: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  article?: string
  category_id?: string
  category?: string | null
  image_url?: string | null
  stock: number
  discount_percentage?: number
  is_featured?: boolean
  created_at: string
  updated_at?: string
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'cancelled'
  address: string
  payment_method: string
  phone_number: string
  created_at: string
  updated_at?: string
  items?: OrderItem[]
  order_items?: OrderItem[]
  delivery_option: string
  delivery_address?: string
  total_amount: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  price: number
  quantity: number
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string
  phone_number?: string
  address?: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Cart {
  items: CartItem[]
  total: number
}

export interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  image_url?: string
} 