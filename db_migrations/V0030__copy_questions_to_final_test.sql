-- Копируем вопросы из теста 9 в тест 13
INSERT INTO t_p8600777_corporate_training_p.questions_v2 
  (test_id, type, text, options, correct_answer, points, "order", matching_pairs, text_check_type, image_url, created_at)
SELECT 
  13,
  type,
  text,
  options,
  correct_answer,
  points,
  "order",
  matching_pairs,
  text_check_type,
  image_url,
  NOW()
FROM t_p8600777_corporate_training_p.questions_v2
WHERE test_id = 9;

-- Обновляем счетчик вопросов
UPDATE t_p8600777_corporate_training_p.tests_v2
SET questions_count = 4, updated_at = NOW()
WHERE id = 13;