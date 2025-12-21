-- Исправляем test_id у уроков курса 5

-- Убираем test_id у видео-урока (он не должен быть тестом)
UPDATE t_p8600777_corporate_training_p.lessons_v2 
SET test_id = NULL 
WHERE id = 10 AND type = 'video';

-- Создаем финальный тест
INSERT INTO t_p8600777_corporate_training_p.tests_v2 
  (title, description, pass_score, time_limit, attempts, questions_count, status, created_at, updated_at)
VALUES 
  ('Финальный тест по продажам', 'Итоговый тест курса по продажам', 70, 30, 1, 0, 'published', NOW(), NOW());

-- Привязываем финальный тест к уроку 11
UPDATE t_p8600777_corporate_training_p.lessons_v2 
SET test_id = (SELECT id FROM t_p8600777_corporate_training_p.tests_v2 WHERE title = 'Финальный тест по продажам' LIMIT 1)
WHERE id = 11;