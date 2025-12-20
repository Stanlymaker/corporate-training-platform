-- Таблица для отслеживания попыток прохождения тестов
CREATE TABLE IF NOT EXISTS test_attempts_v2 (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    course_id INTEGER NOT NULL,
    attempts_used INTEGER DEFAULT 0,
    max_attempts INTEGER NOT NULL,
    best_score INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_test_attempts_user_lesson ON test_attempts_v2(user_id, lesson_id);
CREATE INDEX idx_test_attempts_user_course ON test_attempts_v2(user_id, course_id);