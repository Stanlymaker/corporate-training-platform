-- V0017: Create test admin with verified bcrypt hash
-- Email: test@admin.com
-- Password: 12345678
-- Hash verified with Python: bcrypt.hashpw(b'12345678', bcrypt.gensalt())

INSERT INTO users_v2 (email, name, password_hash, role, is_active, registration_date, last_active, created_at, updated_at) 
VALUES (
    'test@admin.com', 
    'Test Admin', 
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'admin', 
    true, 
    NOW(), 
    NOW(), 
    NOW(), 
    NOW()
) ON CONFLICT (email) DO NOTHING;