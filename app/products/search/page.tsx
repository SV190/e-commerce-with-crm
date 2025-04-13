"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Product } from "@/types/supabase"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"
import { ShoppingCart, Search, AlertCircle } from "lucide-react"
import { cartService } from "@/services/cartService"
import { databaseService } from "@/services/database"

type Cart = { [key: string]: number }

function ProductSearchContent() {
  const [article, setArticle] = useState("")
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<Cart>({})

  const searchProduct = async () => {
    if (!article.trim()) {
      setError("Введите артикул товара")
      return
    }

    setError(null)
    setLoading(true)
    setProduct(null)

    try {
      const result = await databaseService.getProductByArticle(article.trim())
      
      if (!result) {
        setError(`Товар с артикулом "${article}" не найден`)
        return
      }
      
      setProduct(result)
      
      // Получаем текущую корзину для отображения количества товаров
      const currentCart = cartService.getCart()
      setCart(currentCart)
    } catch (error) {
      console.error("Error searching product:", error)
      setError(error instanceof Error ? error.message : "Произошла ошибка при поиске товара")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string) => {
    try {
      const updatedCart = await cartService.addToCart(productId)
      setCart(updatedCart)
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      const updatedCart = await cartService.removeFromCart(productId)
      setCart(updatedCart)
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Поиск товара по артикулу</h1>
      
      <div className="max-w-xl mx-auto mb-12">
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Введите артикул товара (например, ELEC-NB-HP001)"
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={searchProduct} disabled={loading}>
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-b-transparent rounded-full"></div>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Поиск
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
      
      {product && (
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            {product.image_url && (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Запасное изображение, если основное не загрузится
                    e.currentTarget.src = `https://placehold.co/600x400/3b82f6/white?text=${encodeURIComponent(product.name)}`;
                  }}
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Артикул: {product.article}</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">{product.price} ₽</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Описание</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => removeFromCart(product.id)}
                    disabled={!cart[product.id]}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{cart[product.id] || 0}</span>
                  <Button
                    variant="outline"
                    onClick={() => addToCart(product.id)}
                  >
                    +
                  </Button>
                </div>
                
                <div className="flex space-x-3">
                  <Link href={`/products/${product.id}`}>
                    <Button variant="outline">
                      Подробнее
                    </Button>
                  </Link>
                  <Button
                    onClick={() => addToCart(product.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    В корзину
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!product && !loading && !error && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Введите артикул товара для поиска</p>
        </div>
      )}
    </div>
  )
}

export default function ProductSearchPage() {
  return (
    <ProtectedRoute>
      <ProductSearchContent />
    </ProtectedRoute>
  )
} 