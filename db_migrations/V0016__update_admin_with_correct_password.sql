-- V0016: Update admin password with correct bcrypt hash
-- Email: admin@example.com
-- Password: admin123
-- Hash generated with: bcrypt.hashpw(b'admin123', bcrypt.gensalt())

UPDATE users_v2 
SET password_hash = '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    updated_at = NOW()
WHERE email = 'admin@example.com';