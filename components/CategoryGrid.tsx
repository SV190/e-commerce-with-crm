"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Анимации для карточек
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { 
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
      transition: { type: "spring", stiffness: 300 }
    }
  }

  // Получаем URL изображения для категории
  const getCategoryImage = (categoryId: string) => {
    const images = {
      electronics: [
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?q=80&w=600&auto=format&fit=crop'
      ],
      clothing: [
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop'
      ],
      home: [
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=600&auto=format&fit=crop'
      ],
      sports: [
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop'
      ],
      beauty: [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop'
      ],
      toys: [
        'https://images.unsplash.com/photo-1516981442399-a91139e20ff8?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?q=80&w=600&auto=format&fit=crop'
      ]
    };
    
    // Выбираем первое изображение из массива для данной категории
    const categoryImages = images[categoryId as keyof typeof images] || 
      ['https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop'];
    
    return categoryImages[0];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {categories.map((category, index) => (
        <motion.div
          key={category.id}
          initial="initial"
          animate="animate"
          whileHover="hover"
          variants={cardVariants}
          transition={{ delay: index * 0.1 }}
          className="relative"
        >
          {/* Декоративное размытие фона под карточкой */}
          <div 
            className="absolute inset-0 -z-10 blur-xl rounded-full opacity-60 transform scale-75"
            style={{ background: `radial-gradient(circle, ${category.color}40 0%, transparent 70%)` }}
          ></div>

          <Link href={`/products?category=${category.id}`}>
            <Card 
              className="h-full transition-all duration-300 cursor-pointer overflow-hidden group backdrop-blur-lg bg-white/20 border-white/20"
              variant="glass"
              shadow="lg"
            >
              {/* Фоновое изображение категории */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <img 
                  src={getCategoryImage(category.id)} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 flex items-center justify-center rounded-lg text-3xl backdrop-blur-sm"
                    style={{ backgroundColor: `${category.color}40` }}
                  >
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                </div>
                <p className="text-gray-700 mb-4">{category.description}</p>
                <div 
                  className="flex items-center text-sm font-medium p-2 rounded-lg transition-all group-hover:bg-white/30 w-fit"
                  style={{ color: category.color }}
                >
                  <span>Перейти к товарам</span>
                  <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
} 