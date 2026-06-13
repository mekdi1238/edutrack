-- ============================================
-- EduTrack Database Schema + Sample Data
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff'
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id INTEGER REFERENCES departments(id),
    year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 5),
    gpa NUMERIC(3,2) NOT NULL CHECK (gpa >= 0 AND gpa <= 4),
    enrollment_date DATE DEFAULT CURRENT_DATE
);

-- ---------- Departments ----------
INSERT INTO departments (name) VALUES
('Computer Science'),
('Business'),
('Engineering'),
('Mathematics');

-- ---------- Users ----------
-- username: admin / password: admin123
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2b$10$N/GiTsFZR6F1TaFGcRDrQ.IwI1en49ZWx57YrSg.psUvGzrhrc2fK', 'Admin User', 'admin');

-- ---------- Sample Students ----------
INSERT INTO students (student_id, name, email, phone, department_id, year_level, gpa, enrollment_date) VALUES
('STU2024001', 'Newal Tesfaye',     'newal.tesfaye@gmail.com',     '0911000001', 1, 3, 3.75, '2024-09-01'),
('STU2024002', 'Megdelawit Bekele', 'megdelawit.bekele@yahoo.com', '0911000002', 2, 2, 3.40, '2024-09-01'),
('STU2024003', 'Semhal Girma',      'semhal.girma@gmail.com',      '0911000003', 1, 4, 3.90, '2023-09-01'),
('STU2024004', 'Munira Ahmed',      'munira.ahmed@outlook.com',    '0911000004', 3, 1, 3.20, '2025-09-01'),
('STU2024005', 'Mikiyas Solomon',   'mikiyas.solomon@icloud.com',  '0911000005', 2, 5, 3.60, '2021-09-01');