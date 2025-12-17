-- Создание тестового администратора
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
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@example.com',
    E'Администратор',
    E'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMESn/gGEJ.lVuYKqPXXqxNqK6',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);