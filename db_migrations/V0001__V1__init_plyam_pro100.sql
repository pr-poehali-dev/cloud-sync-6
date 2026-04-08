
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by INTEGER REFERENCES users(id),
    balance DECIMAL(12,2) DEFAULT 0,
    total_earned DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tariffs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(20) UNIQUE NOT NULL,
    entry_price DECIMAL(12,2) NOT NULL,
    matrix_count INTEGER NOT NULL DEFAULT 5
);

INSERT INTO tariffs (name, slug, entry_price) VALUES
('Мини', 'mini', 300),
('Минор', 'minor', 6000),
('Мажор', 'major', 120000);

CREATE TABLE matrix_levels (
    id SERIAL PRIMARY KEY,
    tariff_id INTEGER REFERENCES tariffs(id),
    level_number INTEGER NOT NULL,
    payout_per_slot DECIMAL(12,2) NOT NULL,
    slots_count INTEGER NOT NULL DEFAULT 2
);

INSERT INTO matrix_levels (tariff_id, level_number, payout_per_slot, slots_count) VALUES
-- Мини (300 руб вход)
(1, 1, 300, 2),
(1, 2, 600, 2),
(1, 3, 1200, 4),
(1, 4, 2400, 4),
(1, 5, 4800, 4),
-- Минор (6000 руб вход) x20
(2, 1, 6000, 2),
(2, 2, 12000, 2),
(2, 3, 24000, 4),
(2, 4, 48000, 4),
(2, 5, 96000, 4),
-- Мажор (120000 руб вход) x400
(3, 1, 120000, 2),
(3, 2, 240000, 2),
(3, 3, 480000, 4),
(3, 4, 960000, 4),
(3, 5, 1920000, 4);

CREATE TABLE user_matrices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tariff_id INTEGER REFERENCES tariffs(id),
    level_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    slots_filled INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE matrix_slots (
    id SERIAL PRIMARY KEY,
    matrix_id INTEGER REFERENCES user_matrices(id),
    slot_position INTEGER NOT NULL,
    filled_by_user_id INTEGER REFERENCES users(id),
    filled_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    sbp_phone VARCHAR(20),
    sbp_bank VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
