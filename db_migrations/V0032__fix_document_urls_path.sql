-- Исправляем пути для документов в lesson_materials_v2
-- Заменяем /images/ на /documents/ для PDF и DOC файлов

UPDATE t_p8600777_corporate_training_p.lesson_materials_v2 
SET url = REPLACE(url, '/images/', '/documents/') 
WHERE type IN ('pdf', 'doc') AND url LIKE '%/images/%';