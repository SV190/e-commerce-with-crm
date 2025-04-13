-- Добавляем новые столбцы в таблицу products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured) WHERE is_featured = true;

-- Обновляем существующие продукты, присваивая категории на основе артикулов
UPDATE products SET category = 'Электроника' WHERE article LIKE 'ELEC-%';
UPDATE products SET category = 'Одежда' WHERE article LIKE 'CLOTH-%';
UPDATE products SET category = 'Дом и сад' WHERE article LIKE 'HOME-%';
UPDATE products SET category = 'Спорт' WHERE article LIKE 'SPORT-%';
UPDATE products SET category = 'Красота' WHERE article LIKE 'BEAUTY-%';
UPDATE products SET category = 'Игрушки' WHERE article LIKE 'TOY-%';
UPDATE products SET category = 'Продукты питания' WHERE article LIKE 'FOOD-%';
UPDATE products SET category = 'Книги' WHERE article LIKE 'BOOK-%';

-- Устанавливаем случайные значения для stock (от 1 до 100)
UPDATE products SET stock = floor(random() * 100) + 1;

-- Добавляем акции на некоторые товары
UPDATE products SET discount_percentage = 15 WHERE random() < 0.2;
UPDATE products SET discount_percentage = 25 WHERE random() < 0.1 AND discount_percentage = 0;
UPDATE products SET discount_percentage = 10 WHERE discount_percentage = 0 AND random() < 0.15;

-- Отмечаем некоторые товары как рекомендуемые
UPDATE products SET is_featured = true WHERE random() < 0.1; 