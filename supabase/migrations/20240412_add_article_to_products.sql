-- Добавляем поле article в таблицу products
ALTER TABLE products ADD COLUMN IF NOT EXISTS article TEXT;

-- Заполняем существующие записи временными артикулами
UPDATE products SET article = 'ART-' || id::text WHERE article IS NULL;

-- Делаем поле article NOT NULL
ALTER TABLE products ALTER COLUMN article SET NOT NULL;

-- Создаем индекс для быстрого поиска по артикулу
CREATE INDEX IF NOT EXISTS idx_products_article ON products (article);

-- Добавляем ограничение уникальности для артикула
ALTER TABLE products ADD CONSTRAINT unique_product_article UNIQUE (article); 