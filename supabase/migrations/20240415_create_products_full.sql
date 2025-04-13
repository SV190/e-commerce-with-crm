-- Удаляем таблицу products если она существует (опционально)
DROP TABLE IF EXISTS products CASCADE;

-- Создаем таблицу products со всеми необходимыми полями
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  article TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  category TEXT,
  discount_percentage INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ограничения
  CONSTRAINT article_not_empty CHECK (article <> ''),
  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT stock_not_negative CHECK (stock >= 0),
  CONSTRAINT discount_percentage_range CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CONSTRAINT unique_product_article UNIQUE (article)
);

-- Создаем индексы для быстрого поиска и фильтрации
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('russian', name));
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_article ON products (article);
CREATE INDEX idx_products_is_featured ON products (is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_discount ON products (discount_percentage) WHERE discount_percentage > 0;
CREATE INDEX idx_products_stock ON products (stock) WHERE stock > 0;

-- Создаем индекс для fulltext поиска
CREATE INDEX idx_products_fulltext ON products USING gin(to_tsvector('russian', name || ' ' || coalesce(description, '')));

-- Создаем триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Создаем политики доступа
CREATE POLICY "Allow anonymous read access" ON products
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated users to update" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Allow authenticated users to insert" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Allow authenticated users to delete" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Добавляем примеры товаров
INSERT INTO products (name, description, price, article, image_url, stock, category, discount_percentage, is_featured)
VALUES
-- Электроника
('Смартфон iPhone 13', 'Мощный смартфон с отличной камерой и производительностью', 79999.00, 'ELEC-IP13-001', 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=500&h=350&auto=format&fit=crop', 15, 'Электроника', 10, true),
('Ноутбук HP Pavilion', '15.6" FHD, Intel Core i5, 8GB RAM, 512GB SSD', 59999.00, 'ELEC-NB-HP001', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500&h=350&auto=format&fit=crop', 8, 'Электроника', 0, false),
('Телевизор Samsung QLED', '55" 4K UHD Smart TV с HDR и голосовым управлением', 89999.00, 'ELEC-TV-SM001', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=500&h=350&auto=format&fit=crop', 5, 'Электроника', 15, true),

-- Одежда
('Футболка мужская', 'Хлопковая футболка классического кроя', 1299.00, 'CLOTH-TSHM-001', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=500&h=350&auto=format&fit=crop', 50, 'Одежда', 0, false),
('Джинсы женские', 'Стильные джинсы с высокой посадкой', 2999.00, 'CLOTH-JW-001', 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500&h=350&auto=format&fit=crop', 30, 'Одежда', 20, true),

-- Дом и сад
('Стол обеденный', 'Современный обеденный стол из массива дерева', 15999.00, 'HOME-TB-001', 'https://images.unsplash.com/photo-1554295405-abb8fd54f153?q=80&w=500&h=350&auto=format&fit=crop', 3, 'Дом и сад', 0, false),
('Диван угловой', 'Просторный угловой диван с обивкой из экокожи', 45999.00, 'HOME-SOF-001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=500&h=350&auto=format&fit=crop', 2, 'Дом и сад', 5, true),

-- Спорт
('Гантели 5кг', 'Пара гантелей для фитнеса весом 5кг', 1999.00, 'SPORT-DUMB-001', 'https://images.unsplash.com/photo-1590645833383-c4f67e5b6af5?q=80&w=500&h=350&auto=format&fit=crop', 20, 'Спорт', 0, false),
('Велосипед горный', 'Горный велосипед с 21 скоростью', 25999.00, 'SPORT-BIKE-001', 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=500&h=350&auto=format&fit=crop', 7, 'Спорт', 10, true),

-- Красота
('Помада матовая', 'Стойкая матовая помада', 999.00, 'BEAUTY-LIP-001', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=500&h=350&auto=format&fit=crop', 40, 'Красота', 0, false),
('Парфюм женский', 'Изысканный аромат с цветочными нотами', 3999.00, 'BEAUTY-PERF-001', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500&h=350&auto=format&fit=crop', 15, 'Красота', 5, true),

-- Книги и товары для детей
('Конструктор LEGO', 'Набор LEGO для развития творческих способностей', 2499.00, 'TOY-LEGO-001', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=500&h=350&auto=format&fit=crop', 10, 'Игрушки', 0, true),
('Роман "Мастер и Маргарита"', 'Известный роман Михаила Булгакова', 599.00, 'BOOK-CLASS-001', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=500&h=350&auto=format&fit=crop', 25, 'Книги', 0, false);

-- Комментарий: этот скрипт создает полную структуру таблицы products со всеми необходимыми полями,
-- индексами, ограничениями и примерами данных. Таблица оптимизирована для быстрого поиска и
-- фильтрации по различным параметрам (категории, цене, наличию скидок и т.д.). 