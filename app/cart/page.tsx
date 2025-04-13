"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { cartService } from "@/services/cartService"
import { Product } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

// Компонент скелетон-загрузчика для элемента корзины
function CartItemSkeleton() {
  return (
    <Card className="mb-4">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-6">
          <Skeleton className="w-20 h-20 rounded" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="flex items-center space-x-6 pt-4 ml-4 pl-4 border-l border-gray-100">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// Создаем локальный компонент иконок для использования в приложении
const Icons = {
  arrowRight: ArrowRight
}

function EmptyCart() {
  return (
    <div className="text-center py-10">
      <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-medium mb-2">Ваша корзина пуста</h2>
      <p className="text-gray-500 mb-6">Добавьте товары в корзину, чтобы продолжить покупки</p>
      <Link href="/products">
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          Перейти к товарам
        </Button>
      </Link>
    </div>
  )
}

function CartPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [cartTotal, setCartTotal] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Загружаем корзину и продукты параллельно для ускорения
        const [userCart, allProducts] = await Promise.all([
          cartService.loadUserCart(),
          databaseService.getProducts()
        ]);
        
        setCart(userCart)
        
        // Если корзина пустая, останавливаемся
        if (Object.keys(userCart).length === 0) {
          setLoading(false)
          return
        }
        
        // Отфильтровываем только продукты из корзины
        const cartProducts = allProducts.filter(product => userCart[product.id])
        setProducts(cartProducts)
        
        // Вычисляем общую стоимость
        let total = 0
        cartProducts.forEach(product => {
          const quantity = userCart[product.id]
          const price = product.discount_percentage 
            ? product.price * (1 - product.discount_percentage / 100) 
            : product.price
          total += price * quantity
        })
        
        setCartTotal(total)
      } catch (error) {
        console.error("Error loading cart data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const increaseItem = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product && cart[productId] < product.stock) {
      const updatedCart = await cartService.addToCart(productId)
      setCart(updatedCart)
      
      // Обновляем общую стоимость
      const price = product.discount_percentage 
        ? product.price * (1 - product.discount_percentage / 100) 
        : product.price
      setCartTotal(prev => prev + price)
    }
  }

  const decreaseItem = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (product) {
        const currentQuantity = cart[productId];
        let updatedCart;
        
        if (currentQuantity === 1) {
          // Если количество равно 1, полностью удаляем товар из корзины
          updatedCart = await cartService.removeFromCart(productId);
          // Удаляем продукт из списка
          setProducts(prev => prev.filter(p => p.id !== productId));
        } else {
          // Если количество больше 1, уменьшаем на 1
          updatedCart = await cartService.decreaseItem(productId);
        }
        
        setCart(updatedCart);
        
        // Обновляем общую стоимость
        const price = product.discount_percentage 
          ? product.price * (1 - product.discount_percentage / 100) 
          : product.price;
        setCartTotal(prev => prev - price);
      }
    } catch (error) {
      console.error("Ошибка при уменьшении количества товара:", error);
      // Дополнительная обработка ошибки - обновляем состояние из локального хранилища
      try {
        // Получаем актуальное состояние корзины
        const actualCart = cartService.getCart();
        setCart(actualCart);
        
        // Пересчитываем общую стоимость на основе обновленной корзины
        let newTotal = 0;
        products.forEach(product => {
          if (actualCart[product.id]) {
            const price = product.discount_percentage 
              ? product.price * (1 - product.discount_percentage / 100) 
              : product.price;
            newTotal += price * actualCart[product.id];
          }
        });
        setCartTotal(newTotal);
        
        // Обновляем список товаров, если необходимо
        setProducts(prev => prev.filter(p => actualCart[p.id]));
      } catch (syncError) {
        console.error("Не удалось синхронизировать состояние после ошибки:", syncError);
      }
    }
  };

  const removeItem = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      const quantity = cart[productId]
      const updatedCart = await cartService.removeFromCart(productId)
      setCart(updatedCart)
      
      // Удаляем продукт из списка
      setProducts(prev => prev.filter(p => p.id !== productId))
      
      // Обновляем общую стоимость
      const price = product.discount_percentage 
        ? product.price * (1 - product.discount_percentage / 100) 
        : product.price
      setCartTotal(prev => prev - (price * quantity))
    }
  }

  const clearCart = async () => {
    await cartService.clearCart()
    setCart({})
    setProducts([])
    setCartTotal(0)
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Корзина</h1>
        <div className="space-y-4">
          {Array(3).fill(0).map((_, index) => (
            <CartItemSkeleton key={index} />
          ))}
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Сумма товаров:</span>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex justify-between mb-4">
              <span>Доставка:</span>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Итого:</span>
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === productId)
    if (!product) return null

    return (
      <Card key={productId} className="mb-4">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-6">
            <div className="relative w-20 h-20 rounded overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/200x200/e2e8f0/64748b?text=Товар";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-xs">Нет фото</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="text-gray-600">{Math.round(product.price)} ₽</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 pt-4 ml-4 pl-4 border-l border-gray-100">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => decreaseItem(productId)}
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => increaseItem(productId)}
              >
                +
              </Button>
            </div>
            <p className="font-semibold text-lg text-blue-600 min-w-[80px] text-right">{Math.round(product.price * quantity)} ₽</p>
          </div>
        </CardContent>
      </Card>
    )
  }).filter(Boolean)

  const totalPrice = cartTotal

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Корзина</h1>
      {cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <div>
          {cartItems}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Сумма товаров:</span>
              <span>{Math.round(totalPrice)} ₽</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Доставка:</span>
              <span>0 ₽</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Итого:</span>
              <span>{Math.round(totalPrice)} ₽</span>
            </div>
          </div>
          <div className="pt-6 border-t">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <Button 
                variant="outline" 
                onClick={clearCart} 
                className="w-full md:w-auto"
                disabled={loading}
              >
                Очистить корзину
              </Button>
              
              <Button 
                onClick={handleCheckout}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loading}
              >
                Оформить заказ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartPageContent />
    </ProtectedRoute>
  )
} 