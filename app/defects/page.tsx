"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { databaseService } from "@/services/database"
import { Defect, Product } from "@/types/supabase"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertCircle, Check, PackageOpen, Package, Info, Calendar, ChevronLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    product_name: "",
    quantity: 0,
    defect_type: "",
    description: ""
  })
  
  // Новое состояние для поиска товара
  const [articleSearch, setArticleSearch] = useState("")
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const [productFound, setProductFound] = useState<Product | null>(null)
  const [productSearchError, setProductSearchError] = useState("")
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  const [displayQuantity, setDisplayQuantity] = useState("")

  useEffect(() => {
    loadDefects()
  }, [])

  const loadDefects = async () => {
    try {
      setLoading(true)
      const data = await databaseService.getDefects()
      setDefects(data)
    } catch (error) {
      console.error("Error loading defects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'quantity') {
      // Обновляем отображаемое значение
      setDisplayQuantity(value)
      
      // Если введено значение "0", очищаем поле
      if (value === '0') {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }))
      } else {
        // Иначе преобразуем в число или оставляем 0
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? 0 : parseInt(value) || 0
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Функция для поиска товара по артикулу
  const searchProductByArticle = async () => {
    if (!articleSearch.trim()) {
      setProductSearchError("Введите артикул товара")
      return
    }
    
    try {
      setProductSearchLoading(true)
      setProductSearchError("")
      setProductFound(null)
      
      const product = await databaseService.getProductByArticle(articleSearch.trim())
      
      if (product) {
        setProductFound(product)
        // Заполняем форму данными найденного товара
        setFormData(prev => ({
          ...prev,
          product_name: product.name
        }))
      } else {
        setProductSearchError("Товар с таким артикулом не найден")
      }
    } catch (error) {
      console.error("Ошибка при поиске товара:", error)
      setProductSearchError("Ошибка при поиске товара")
    } finally {
      setProductSearchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus("submitting")
    
    try {
      console.log('Submitting defect data:', {
        product_name: formData.product_name,
        quantity: formData.quantity,
        defect_type: formData.defect_type,
        description: formData.description,
        status: 'open',
        // Если товар найден, добавляем его артикул в данные
        product_id: productFound?.id || null,
        product_article: productFound?.article || null
      })
      
      const result = await databaseService.createDefect({
        product_name: formData.product_name,
        quantity: formData.quantity,
        defect_type: formData.defect_type as 'production' | 'material' | 'equipment' | 'other',
        description: formData.description,
        status: 'open',
        // Если товар найден, добавляем его идентификатор и артикул
        product_id: productFound?.id || null,
        product_article: productFound?.article || null
      })
      
      console.log('Defect created successfully:', result)
      
      // Reset form
      setFormData({
        product_name: "",
        quantity: 0,
        defect_type: "",
        description: ""
      })
      setArticleSearch("")
      setProductFound(null)
      setDisplayQuantity("")
      setSubmitStatus("success")
      
      // Reload defects
      loadDefects()
      
      // Сбрасываем статус через 3 секунды
      setTimeout(() => {
        setSubmitStatus(null)
      }, 3000)
    } catch (error) {
      console.error("Error creating defect:", error)
      setSubmitStatus("error")
    }
  }

  const getDefectTypeLabel = (type: string) => {
    switch (type) {
      case 'production': return 'Производственный брак';
      case 'material': return 'Брак материала';
      case 'equipment': return 'Брак оборудования';
      case 'other': return 'Другое';
      default: return type;
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/crm">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Назад к CRM
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Учет брака</h1>
        <p className="text-muted-foreground">
          Регистрация и учет бракованной продукции на складе
        </p>
      </div>
      
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="register">Регистрация брака</TabsTrigger>
          <TabsTrigger value="history">История записей</TabsTrigger>
        </TabsList>
        
        <TabsContent value="register">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Регистрация брака</CardTitle>
                <CardDescription>
                  Заполните форму для регистрации бракованной продукции
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Блок поиска товара по артикулу */}
                  <div className="bg-muted/50 p-4 rounded-lg border border-muted">
                    <div className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Поиск товара по артикулу
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        value={articleSearch}
                        onChange={(e) => setArticleSearch(e.target.value)}
                        placeholder="Введите артикул товара"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={searchProductByArticle}
                        disabled={productSearchLoading}
                        variant="secondary"
                      >
                        {productSearchLoading ? (
                          <div className="w-4 h-4 border-2 border-b-transparent border-current rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Найти
                      </Button>
                    </div>
                    
                    {/* Отображение результата поиска */}
                    {productSearchError && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {productSearchError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {productFound && (
                      <Alert className="mt-3 bg-green-50 border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="flex flex-col">
                          <span className="font-medium">{productFound.name}</span>
                          <span className="text-sm text-gray-500">
                            Артикул: {productFound.article} | Цена: {productFound.price.toLocaleString('ru-RU')} ₽
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Наименование продукции</Label>
                      <Input
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleInputChange}
                        placeholder="Введите наименование"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Количество</Label>
                      <Input
                        type="number"
                        name="quantity"
                        value={displayQuantity}
                        onChange={handleInputChange}
                        placeholder="Введите количество"
                        required
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Тип брака</Label>
                    <Select 
                      name="defect_type"
                      value={formData.defect_type}
                      onValueChange={(value) => handleSelectChange("defect_type", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип брака" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Производственный брак</SelectItem>
                        <SelectItem value="material">Брак материала</SelectItem>
                        <SelectItem value="equipment">Брак оборудования</SelectItem>
                        <SelectItem value="other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Опишите причину брака"
                      required
                    />
                  </div>
                  
                  {submitStatus === "success" && (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertTitle>Успешно!</AlertTitle>
                      <AlertDescription>
                        Информация о браке успешно зарегистрирована
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {submitStatus === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ошибка</AlertTitle>
                      <AlertDescription>
                        Произошла ошибка при регистрации брака
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={submitStatus === "submitting"}
                  >
                    {submitStatus === "submitting" ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Сохранение...
                      </>
                    ) : (
                      "Зарегистрировать брак"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
                <CardDescription>
                  Сводная информация по бракованной продукции
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/50 p-4 rounded-lg border border-muted flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                      <PackageOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Всего зарегистрировано</div>
                      <div className="text-2xl font-bold">{defects.length} <span className="text-sm font-normal text-muted-foreground">записей</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-muted flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Общее количество брака</div>
                      <div className="text-2xl font-bold">
                        {defects.reduce((sum, defect) => sum + defect.quantity, 0)} <span className="text-sm font-normal text-muted-foreground">шт.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-muted flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">За текущий месяц</div>
                      <div className="text-2xl font-bold">
                        {defects.filter(defect => {
                          const date = new Date(defect.created_at);
                          const now = new Date();
                          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                        }).length} <span className="text-sm font-normal text-muted-foreground">записей</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>История записей</CardTitle>
              <CardDescription>
                Все зарегистрированные случаи брака на складе
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 border-4 border-b-transparent border-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : defects.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="flex justify-center mb-4">
                    <Info className="h-12 w-12 text-muted" />
                  </div>
                  <p>Нет записей о браке</p>
                </div>
              ) : (
                <ScrollArea className="h-[550px] pr-4">
                  <div className="space-y-4">
                    {defects.map((defect) => (
                      <div key={defect.id} className="p-4 bg-muted/30 rounded-lg border border-muted">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-base">{defect.product_name}</h3>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {defect.product_article && (
                                <div className="inline-flex items-center text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
                                  <Package className="h-3 w-3 mr-1" />
                                  Артикул: {defect.product_article}
                                </div>
                              )}
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-50">
                                {getDefectTypeLabel(defect.defect_type)}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
                                {defect.quantity} шт.
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(defect.created_at)}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground border-t border-muted pt-3">
                          {defect.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Label component for form fields
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  )
} 