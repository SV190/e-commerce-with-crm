'use client'

import { useState, useEffect } from "react"
import { databaseService } from "@/services/database"
import { Product } from "@/types/supabase"
import Link from "next/link"
import { MotionDiv } from "@/components/ui/motion"
import { Heart, Package, ShoppingCart } from "lucide-react"
import { useCart } from "@/components/CartContext"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true)
        const data = await databaseService.getProducts()
        const featured = data.filter(product => product.is_featured).slice(0, 4)
        setProducts(featured)
      } catch (error) {
        console.error("Error loading featured products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedProducts()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl shadow-[10px_10px_20px_rgba(0,0,0,0.03),-10px_-10px_20px_rgba(255,255,255,0.7)]"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <Link href={`/products/${product.id}`} key={product.id}>
          <MotionDiv 
            className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-2 shadow-[10px_10px_20px_rgba(0,0,0,0.08),-10px_-10px_20px_rgba(255,255,255,0.9)]
              hover:shadow-[12px_12px_24px_rgba(0,0,0,0.12),-12px_-12px_24px_rgba(255,255,255,0.95)] transition-all duration-300"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="overflow-hidden rounded-xl">
              <div className="h-48 relative overflow-hidden rounded-t-xl">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="h-full w-full object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/600x400/3b82f6/white?text=${encodeURIComponent(product.name)}`;
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500">
                    <Package className="h-12 w-12 text-white" />
                  </div>
                )}
                
                {product.discount_percentage !== undefined && product.discount_percentage > 0 && (
                  <div className="absolute top-3 right-3 bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold py-1 px-3 text-xs rounded-full shadow-md">
                    -{product.discount_percentage}%
                  </div>
                )}

                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs py-1 px-2 rounded-full shadow-md">
                    Осталось: {product.stock} шт.
                  </div>
                )}

                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
                    <div className="relative bg-red-600 py-2 px-6 rounded-lg shadow-lg rotate-6">
                      <div className="absolute inset-0 bg-red-500 blur-sm"></div>
                      <span className="relative text-white font-bold tracking-wider">НЕТ В НАЛИЧИИ</span>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // В будущем здесь может быть добавление в избранное
                  }}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center z-20 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4 rounded-b-xl bg-white">
                <div className="mb-2">
                  <div className="flex items-center mt-1 mb-1">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-2">
                      {product.category || 'Товар'}
                    </span>
                    <div className="flex">
                      {/* Используем id товара для генерации стабильного рейтинга */}
                      {Array.from({ length: 5 }).map((_, i) => {
                        // Преобразуем id в число для использования в качестве сида
                        const idSum = product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                        // Генерируем рейтинг на основе id (от 3.5 до 5)
                        const rating = 3.5 + (idSum % 15) / 10;
                        return (
                          <span 
                            key={i} 
                            className={`text-xs ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors text-base">
                    {product.name}
                  </h3>
                </div>
                
                <div className="pt-3 mt-auto border-t border-gray-100">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      {product.discount_percentage !== undefined && product.discount_percentage > 0 ? (
                        <>
                          <p className="text-xl font-bold text-gray-800">
                            {Math.round(product.price * (1 - product.discount_percentage / 100))} ₽
                          </p>
                          <p className="text-xs text-gray-400 line-through">
                            {product.price} ₽
                          </p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-gray-800">{product.price} ₽</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product.id, 1);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
                      title="Добавить в корзину"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </MotionDiv>
        </Link>
      ))}
    </div>
  )
} 