-- Создание тестового студента для проверки авторизации
-- Email: student@test.com, Пароль: 123456
INSERT INTO users (
    id, 
    email, 
    name, 
    password_hash,
    role, 
    is_active, 
    registration_date, 
    last_active, 
    created_at, 
    updated_at
) VALUES (
    '650e8400-e29b-41d4-a716-446655440001',
    'student@test.com',
    'Тестовый студент',
    '$2b$12$8fvlC.LTJPjVrxVEtOjZuO3MXKF5oQH9VJqKZJz8JyYTnxQZWJYdy',
    'student',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);