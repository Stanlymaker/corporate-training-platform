-- V0015: Update admin password to correct hash
-- Password: admin123

UPDATE users_v2 
SET password_hash = '$2b$12$K2aQPJZ8Zr7wKqX.vX0sIuK1vYMJVZ2nQX8FQF7K7PQX8FQF7K7PQ'
WHERE email = 'admin@example.com';