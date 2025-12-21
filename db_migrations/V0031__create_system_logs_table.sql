-- Создаем таблицу для системных логов
CREATE TABLE IF NOT EXISTS t_p8600777_corporate_training_p.system_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    level VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id INTEGER,
    user_name VARCHAR(255),
    message TEXT NOT NULL,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON t_p8600777_corporate_training_p.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON t_p8600777_corporate_training_p.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON t_p8600777_corporate_training_p.system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON t_p8600777_corporate_training_p.system_logs(user_id);