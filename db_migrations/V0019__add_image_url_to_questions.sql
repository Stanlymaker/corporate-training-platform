-- Добавляем колонку image_url в таблицу questions_v2
ALTER TABLE questions_v2 ADD COLUMN IF NOT EXISTS image_url TEXT;