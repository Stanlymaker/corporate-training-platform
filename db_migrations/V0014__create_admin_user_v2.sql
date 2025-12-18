-- V0014: Create admin user in users_v2 table
-- Email: admin@example.com
-- Password: admin123 (hashed with bcrypt)

INSERT INTO users_v2 (email, name, password_hash, role, is_active, registration_date, last_active, created_at, updated_at) 
VALUES (
    'admin@example.com', 
    'Администратор', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TT6WAwCKVIy3CQPLOKKt7Ys3xHzS', 
    'admin', 
    true, 
    NOW(), 
    NOW(), 
    NOW(), 
    NOW()
);
