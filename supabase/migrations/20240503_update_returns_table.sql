-- Обновление таблицы returns для соответствия интерфейсу Return
ALTER TABLE returns 
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Изменение ограничения на статусы, добавление новых значений
ALTER TABLE returns
  DROP CONSTRAINT IF EXISTS returns_status_check;

ALTER TABLE returns
  ADD CONSTRAINT returns_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'processing'));

-- Изменение ограничения на причины возврата, если нужно большей гибкости
ALTER TABLE returns
  DROP CONSTRAINT IF EXISTS returns_return_reason_check;

-- Удаляем обязательность batch_number, если это необходимо
ALTER TABLE returns
  ALTER COLUMN batch_number DROP NOT NULL; 