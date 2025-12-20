-- Пересчитываем количество уроков для всех курсов
UPDATE courses_v2 
SET lessons_count = (
  SELECT COUNT(*) 
  FROM lessons_v2 
  WHERE lessons_v2.course_id = courses_v2.id
);