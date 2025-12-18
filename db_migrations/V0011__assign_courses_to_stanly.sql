-- Назначаем курсы студенту stanlymaker@gmail.com
INSERT INTO course_assignments (id, user_id, course_id, assigned_by, assigned_at, status, created_at)
VALUES 
  (gen_random_uuid()::text, 'd36ca2f0-ea3f-4642-b2bf-d5f39311870f', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, 'assigned', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'd36ca2f0-ea3f-4642-b2bf-d5f39311870f', 'e051feb5-060a-4e00-8239-11ad68283355', '550e8400-e29b-41d4-a716-446655440000', CURRENT_TIMESTAMP, 'assigned', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, course_id) DO NOTHING;