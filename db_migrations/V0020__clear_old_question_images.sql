-- Очищаем старые изображения вопросов (base64), чтобы загрузить заново через S3
UPDATE questions_v2 SET image_url = NULL WHERE image_url IS NOT NULL;