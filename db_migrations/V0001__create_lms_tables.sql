-- Создание всех таблиц для LMS системы с поддержкой UTF-8

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    position TEXT,
    department TEXT,
    phone VARCHAR(50),
    avatar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица курсов
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 0,
    lessons_count INTEGER DEFAULT 0,
    category TEXT,
    image TEXT,
    published BOOLEAN DEFAULT FALSE,
    pass_score INTEGER DEFAULT 70,
    level TEXT,
    instructor TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    access_type VARCHAR(20) DEFAULT 'closed' CHECK (access_type IN ('open', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица уроков
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id),
    title TEXT NOT NULL,
    content TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'video', 'pdf', 'quiz', 'test')),
    "order" INTEGER NOT NULL,
    duration INTEGER DEFAULT 0,
    video_url TEXT,
    description TEXT,
    requires_previous BOOLEAN DEFAULT FALSE,
    test_id VARCHAR(36),
    is_final_test BOOLEAN DEFAULT FALSE,
    final_test_requires_all_lessons BOOLEAN DEFAULT FALSE,
    final_test_requires_all_tests BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица материалов к урокам
CREATE TABLE IF NOT EXISTS lesson_materials (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL REFERENCES lessons(id),
    title TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'doc', 'link', 'video')),
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица тестов
CREATE TABLE IF NOT EXISTS tests (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id),
    lesson_id VARCHAR(36) REFERENCES lessons(id),
    title TEXT NOT NULL,
    description TEXT,
    pass_score INTEGER DEFAULT 70,
    time_limit INTEGER DEFAULT 60,
    attempts INTEGER DEFAULT 3,
    questions_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Таблица вопросов к тестам
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    test_id VARCHAR(36) NOT NULL REFERENCES tests(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('single', 'multiple', 'text', 'matching')),
    text TEXT NOT NULL,
    options JSONB,
    correct_answer JSONB NOT NULL,
    points INTEGER DEFAULT 1,
    "order" INTEGER NOT NULL,
    matching_pairs JSONB,
    text_check_type VARCHAR(20) CHECK (text_check_type IN ('manual', 'automatic')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Таблица прогресса по курсам
CREATE TABLE IF NOT EXISTS course_progress (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    test_score INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    earned_rewards JSONB DEFAULT '[]'::jsonb,
    completed_lesson_ids JSONB DEFAULT '[]'::jsonb,
    last_accessed_lesson VARCHAR(36),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- 8. Таблица назначений курсов
CREATE TABLE IF NOT EXISTS course_assignments (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    assigned_by VARCHAR(36) NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- 9. Таблица результатов тестов
CREATE TABLE IF NOT EXISTS test_results (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id),
    test_id VARCHAR(36) NOT NULL REFERENCES tests(id),
    score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Таблица наград
CREATE TABLE IF NOT EXISTS rewards (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id),
    description TEXT,
    condition TEXT,
    bonuses JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Таблица полученных наград пользователями
CREATE TABLE IF NOT EXISTS user_rewards (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    reward_id VARCHAR(36) NOT NULL REFERENCES rewards(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reward_id)
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_tests_course_id ON tests(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_user_id ON course_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);