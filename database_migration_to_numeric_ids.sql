-- ================================================================================
-- МИГРАЦИЯ БАЗЫ ДАННЫХ: ПЕРЕХОД С UUID НА ЧИСЛОВЫЕ ID
-- ================================================================================
-- ВНИМАНИЕ: Этот скрипт полностью удаляет существующие таблицы и создаёт новые!
-- Все данные будут потеряны. Выполняйте только если вы уверены.
-- ================================================================================

-- Шаг 1: Удаление всех существующих таблиц
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS lesson_materials CASCADE;
DROP TABLE IF EXISTS course_progress CASCADE;
DROP TABLE IF EXISTS course_assignments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================================================================
-- Шаг 2: Создание новых таблиц с числовыми ID
-- ================================================================================

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'student')),
    position TEXT,
    department TEXT,
    phone VARCHAR(50),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица курсов
CREATE TABLE courses (
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
    access_type VARCHAR(50) DEFAULT 'closed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица тестов
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 30,
    pass_score INTEGER DEFAULT 70,
    attempts_allowed INTEGER DEFAULT 3,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица уроков
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'text', 'quiz', 'interactive')),
    "order" INTEGER NOT NULL,
    duration INTEGER DEFAULT 0,
    video_url TEXT,
    description TEXT,
    requires_previous BOOLEAN DEFAULT false,
    test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL,
    is_final_test BOOLEAN DEFAULT false,
    final_test_requires_all_lessons BOOLEAN DEFAULT true,
    final_test_requires_all_tests BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица наград
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица назначений курсов пользователям
CREATE TABLE course_assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Таблица прогресса по курсам
CREATE TABLE course_progress (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_accessed_lesson INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Таблица материалов к урокам
CREATE TABLE lesson_materials (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица вопросов к тестам
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('single', 'multiple', 'text', 'code')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица результатов тестов
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица наград пользователей
CREATE TABLE user_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reward_id)
);

-- ================================================================================
-- Шаг 3: Добавление тестовых данных
-- ================================================================================

-- Пользователи (пароль для всех: 123456)
INSERT INTO users (email, password_hash, name, role, is_active) VALUES
('admin@example.com', '$2b$10$rKZ3YvL6KxFxPzNqY.1U0.K5Jz1dXfNUyJ9Y5Qg7qZGMf8X2k3Rja', 'Администратор', 'admin', true),
('student@example.com', '$2b$10$rKZ3YvL6KxFxPzNqY.1U0.K5Jz1dXfNUyJ9Y5Qg7qZGMf8X2k3Rja', 'Иван Иванов', 'student', true),
('student2@example.com', '$2b$10$rKZ3YvL6KxFxPzNqY.1U0.K5Jz1dXfNUyJ9Y5Qg7qZGMf8X2k3Rja', 'Петр Петров', 'student', true),
('student3@example.com', '$2b$10$rKZ3YvL6KxFxPzNqY.1U0.K5Jz1dXfNUyJ9Y5Qg7qZGMf8X2k3Rja', 'Мария Сидорова', 'student', true);

-- Курсы
INSERT INTO courses (title, description, duration, lessons_count, category, published, pass_score, level, instructor, status, access_type) VALUES
('Основы программирования', 'Изучите основы программирования на Python с нуля', 40, 10, 'Программирование', true, 70, 'Начальный', 'Иван Петров', 'published', 'closed'),
('Веб-разработка', 'Создание современных веб-приложений с React', 60, 15, 'Веб-разработка', true, 75, 'Средний', 'Анна Смирнова', 'published', 'closed');

-- Тесты
INSERT INTO tests (course_id, title, description, duration, pass_score, attempts_allowed, published) VALUES
(1, 'Итоговый тест по основам программирования', 'Проверка знаний по курсу Python', 45, 70, 3, true),
(2, 'Итоговый тест по веб-разработке', 'Проверка знаний по React и веб-технологиям', 60, 75, 3, true);

-- Уроки
INSERT INTO lessons (course_id, title, description, content, type, "order", duration, requires_previous) VALUES
(1, 'Введение в Python', 'Первое знакомство с языком программирования Python', 'В этом уроке вы узнаете что такое Python, для чего он используется и какие возможности предоставляет...', 'video', 1, 30, false),
(1, 'Переменные и типы данных', 'Изучение базовых типов данных в Python', 'Переменные - это именованные области памяти для хранения данных. В Python есть несколько основных типов данных...', 'text', 2, 45, true),
(1, 'Условные операторы', 'Принятие решений в программе с помощью if/else', 'Условные операторы позволяют программе принимать решения и выполнять разный код в зависимости от условий...', 'interactive', 3, 40, true),
(2, 'HTML и CSS основы', 'Создание структуры и стилизация веб-страниц', 'HTML определяет структуру веб-страницы, а CSS отвечает за её внешний вид...', 'video', 1, 60, false),
(2, 'JavaScript основы', 'Добавление интерактивности на веб-страницы', 'JavaScript - язык программирования для создания динамических веб-приложений...', 'text', 2, 50, true);

-- Вопросы для тестов
INSERT INTO questions (test_id, question_text, type, options, correct_answer, points, "order") VALUES
(1, 'Что такое переменная в программировании?', 'single', '["Место для хранения данных", "Функция", "Класс", "Модуль"]', 'Место для хранения данных', 1, 1),
(1, 'Какой тип данных используется для хранения текста?', 'single', '["string", "int", "float", "bool"]', 'string', 1, 2),
(2, 'Что означает HTML?', 'single', '["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"]', 'HyperText Markup Language', 1, 1),
(2, 'Какой тег используется для создания ссылки?', 'single', '["<a>", "<link>", "<href>", "<url>"]', '<a>', 1, 2);

-- Награды
INSERT INTO rewards (name, description, icon, type) VALUES
('Первый курс', 'Завершите свой первый курс', 'trophy', 'achievement'),
('Отличник', 'Пройдите тест на 100%', 'star', 'achievement'),
('Марафонец', 'Завершите 5 курсов', 'medal', 'achievement');

-- Назначение курсов студентам
INSERT INTO course_assignments (course_id, user_id, assigned_by, status) VALUES
(1, 2, 1, 'assigned'),
(2, 2, 1, 'assigned'),
(1, 3, 1, 'assigned');

-- ================================================================================
-- ГОТОВО! Теперь все таблицы используют числовые AUTO-INCREMENT ID
-- ================================================================================
