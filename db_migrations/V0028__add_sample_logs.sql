-- Добавление тестовых логов
INSERT INTO system_logs (timestamp, level, action, message, user_id, ip_address, details) VALUES
(NOW() - INTERVAL '5 minutes', 'success', 'user.login', 'Пользователь успешно вошел в систему', 4, '192.168.1.100', '{"browser": "Chrome", "device": "Desktop"}'::jsonb),
(NOW() - INTERVAL '15 minutes', 'info', 'course.view', 'Открыт курс "Очень интересный Курс!"', 4, '192.168.1.100', '{"courseId": 4, "courseName": "Очень интересный Курс!"}'::jsonb),
(NOW() - INTERVAL '1 hour', 'success', 'lesson.complete', 'Завершен урок в курсе', 4, '192.168.1.100', '{"lessonId": 8, "courseId": 4}'::jsonb),
(NOW() - INTERVAL '2 hours', 'warning', 'user.failed_login', 'Неудачная попытка входа', NULL, '192.168.1.200', '{"email": "test@example.com", "attempts": 3}'::jsonb),
(NOW() - INTERVAL '3 hours', 'error', 'course.access_denied', 'Отказано в доступе к курсу', 4, '192.168.1.100', '{"courseId": 5, "reason": "course_archived"}'::jsonb),
(NOW() - INTERVAL '5 hours', 'info', 'user.register', 'Регистрация нового пользователя', 4, '192.168.1.100', '{"email": "ivan@example.com"}'::jsonb),
(NOW() - INTERVAL '1 day', 'success', 'course.complete', 'Курс успешно завершен', 4, '192.168.1.100', '{"courseId": 4, "score": 85}'::jsonb),
(NOW() - INTERVAL '2 days', 'warning', 'system.performance', 'Высокая нагрузка на систему', NULL, NULL, '{"cpu": 85, "memory": 75}'::jsonb),
(NOW() - INTERVAL '3 days', 'error', 'database.connection', 'Ошибка подключения к базе данных', NULL, NULL, '{"error": "Connection timeout"}'::jsonb),
(NOW() - INTERVAL '1 week', 'info', 'course.create', 'Создан новый курс', 1, '192.168.1.1', '{"courseId": 5, "title": "Очень Закрытый Курс!"}'::jsonb)
