-- Таблица для сохранения результатов тестов с ответами пользователей
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    lesson_id TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    earned_points INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    results JSONB NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_lesson ON test_results(lesson_id);
CREATE INDEX idx_test_results_test ON test_results(test_id);