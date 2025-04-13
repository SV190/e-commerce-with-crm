-- Добавляем колонку images к таблице returns для хранения URL загруженных фотографий
ALTER TABLE returns 
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Комментарий к колонке
COMMENT ON COLUMN returns.images IS 'Массив URL-адресов с фотографиями возврата';

-- Обновляем существующие записи, если нужно
UPDATE returns 
SET images = '[]'::jsonb 
WHERE images IS NULL; 