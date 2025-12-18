-- Создаем новые таблицы с правильной структурой (только INTEGER id)

-- Курсы
CREATE TABLE courses_v2 (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 0,
    lessons_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    image TEXT,
    published BOOLEAN DEFAULT false,
    pass_score INTEGER DEFAULT 70,
    level VARCHAR(50),
    instructor VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    access_type VARCHAR(20) DEFAULT 'closed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Уроки
CREATE TABLE lessons_v2 (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) NOT NULL,
    "order" INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    video_url TEXT,
    description TEXT,
    requires_previous BOOLEAN DEFAULT false,
    test_id INTEGER,
    is_final_test BOOLEAN DEFAULT false,
    final_test_requires_all_lessons BOOLEAN DEFAULT false,
    final_test_requires_all_tests BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тесты
CREATE TABLE tests_v2 (
    id SERIAL PRIMARY KEY,
    course_id INTEGER,
    lesson_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pass_score INTEGER DEFAULT 70,
    time_limit INTEGER DEFAULT 60,
    attempts INTEGER DEFAULT 3,
    questions_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вопросы
CREATE TABLE questions_v2 (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    options JSONB,
    correct_answer JSONB NOT NULL,
    points INTEGER DEFAULT 1,
    "order" INTEGER DEFAULT 0,
    matching_pairs JSONB,
    text_check_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Назначения курсов
CREATE TABLE course_assignments_v2 (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Прогресс обучения
CREATE TABLE course_progress_v2 (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    test_score INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_lesson_ids JSONB DEFAULT '[]'::jsonb,
    last_accessed_lesson INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Результаты тестов
CREATE TABLE test_results_v2 (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    course_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    passed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Материалы уроков
CREATE TABLE lesson_materials_v2 (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_lessons_v2_course_id ON lessons_v2(course_id);
CREATE INDEX idx_questions_v2_test_id ON questions_v2(test_id);
CREATE INDEX idx_course_assignments_v2_user_id ON course_assignments_v2(user_id);
CREATE INDEX idx_course_assignments_v2_course_id ON course_assignments_v2(course_id);
CREATE INDEX idx_course_progress_v2_user_id ON course_progress_v2(user_id);
CREATE INDEX idx_course_progress_v2_course_id ON course_progress_v2(course_id);
CREATE INDEX idx_test_results_v2_user_id ON test_results_v2(user_id);
CREATE INDEX idx_test_results_v2_course_id ON test_results_v2(course_id);
CREATE INDEX idx_lesson_materials_v2_lesson_id ON lesson_materials_v2(lesson_id);