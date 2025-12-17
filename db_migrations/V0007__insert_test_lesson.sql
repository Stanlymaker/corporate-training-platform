-- Добавляем тестовый урок для курса
INSERT INTO lessons (
    id,
    course_id,
    title,
    content,
    type,
    "order",
    duration
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Введение в переменные',
    'В этом уроке мы изучим что такое переменные и как их использовать',
    'text',
    0,
    30
);

-- Обновляем счетчик уроков в курсе
UPDATE courses 
SET lessons_count = 1 
WHERE id = '550e8400-e29b-41d4-a716-446655440001';