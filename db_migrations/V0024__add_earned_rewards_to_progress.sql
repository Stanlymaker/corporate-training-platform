-- Добавляем колонку earned_rewards для хранения полученных наград
ALTER TABLE course_progress_v2 
ADD COLUMN IF NOT EXISTS earned_rewards JSONB DEFAULT '[]'::jsonb;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_course_progress_v2_earned_rewards 
ON course_progress_v2 USING GIN (earned_rewards);