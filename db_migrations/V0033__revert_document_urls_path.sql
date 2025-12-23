-- Откатываем изменение путей для документов
-- Возвращаем /documents/ обратно на /images/ где файлы реально лежат

UPDATE t_p8600777_corporate_training_p.lesson_materials_v2 
SET url = REPLACE(url, '/documents/', '/images/') 
WHERE type IN ('pdf', 'doc') AND url LIKE '%/documents/%';