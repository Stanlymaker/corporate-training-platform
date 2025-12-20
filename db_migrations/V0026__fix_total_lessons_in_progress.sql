-- Обновляем total_lessons в прогрессе на основе реальных данных из courses_v2
UPDATE course_progress_v2 
SET total_lessons = (
  SELECT lessons_count 
  FROM courses_v2 
  WHERE courses_v2.id = course_progress_v2.course_id
);