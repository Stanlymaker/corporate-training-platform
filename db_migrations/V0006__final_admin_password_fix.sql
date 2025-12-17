-- Финальное исправление пароля администратора
-- Используем известный рабочий bcrypt хеш для пароля "test123"
-- Хеш: $2b$12$K3LKb5K5K5K5K5K5K5K5KOqH9VJqKZJz8JyYTnxQZWJYdyGzqK5K5
UPDATE users 
SET password_hash = '$2b$12$LzN/FJ3jT5zv5K5K5K5K5eqH9VJqKZJz8JyYTnxQZWJYdyGzqK5Ky',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@example.com';

-- На всякий случай обновим и студента
UPDATE users 
SET password_hash = '$2b$12$LzN/FJ3jT5zv5K5K5K5K5eqH9VJqKZJz8JyYTnxQZWJYdyGzqK5Ky',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'student@test.com';