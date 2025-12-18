-- V0013: Create v2 tables for users and rewards with INTEGER IDs

-- Users table with INTEGER primary key
CREATE TABLE users_v2 (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    position VARCHAR(255),
    department VARCHAR(255),
    phone VARCHAR(50),
    avatar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards table with INTEGER primary key and reference to courses_v2
CREATE TABLE rewards_v2 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    course_id INTEGER NOT NULL,
    description TEXT,
    condition TEXT,
    bonuses TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User rewards junction table with INTEGER references
CREATE TABLE user_rewards_v2 (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reward_id INTEGER NOT NULL,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reward_id)
);

-- Indexes for performance
CREATE INDEX idx_users_v2_email ON users_v2(email);
CREATE INDEX idx_users_v2_role ON users_v2(role);
CREATE INDEX idx_rewards_v2_course_id ON rewards_v2(course_id);
CREATE INDEX idx_user_rewards_v2_user_id ON user_rewards_v2(user_id);
CREATE INDEX idx_user_rewards_v2_reward_id ON user_rewards_v2(reward_id);
