const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const pool = require('./database/db');

require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'edutrack-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,     // set to true only when serving over HTTPS
        httpOnly: true,
        sameSite: 'lax',   // works because frontend & backend share the same origin
        maxAge: 3600000    // 1 hour
    }
}));

// Serve the frontend as static files from the same origin/port as the API
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Helpers ---

// Require an active session for protected routes
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

// Validate student payload (used for both create and update)
function validateStudent(data) {
    const errors = [];
    const { student_id, name, email, department_id, year_level, gpa } = data;

    if (!student_id || !String(student_id).trim()) {
        errors.push('Student ID is required');
    }

    if (!name || !String(name).trim()) {
        errors.push('Name is required');
    }

    if (!email || !String(email).trim()) {
        errors.push('Email is required');
    } else {
        const parts = String(email).split('@');
        const domain = parts.length === 2 ? parts[1].toLowerCase() : '';
        if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
            errors.push(`Email domain must be one of: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
        }
    }

    if (!department_id) {
        errors.push('Department is required');
    }

    const yearNum = parseInt(year_level, 10);
    if (Number.isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
        errors.push('Year level must be between 1 and 5');
    }

    const gpaNum = parseFloat(gpa);
    if (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
        errors.push('GPA must be between 0 and 4.00');
    }

    return errors;
}

// --- Test endpoint ---
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// --- AUTH ---

// LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
        };

        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// REGISTER
app.post('/api/register', async (req, res) => {
    const { full_name, username, password, passkey } = req.body;

    if (!full_name || !username || !password || !passkey) {
        return res.status(400).json({ error: 'Please fill all fields' });
    }

    if (passkey !== '12345') {
        return res.status(401).json({ error: 'Invalid passkey' });
    }

    try {
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, hashedPassword, full_name, 'staff']
        );

        res.json({ success: true, userId: result.rows[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get current session user
app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// --- DASHBOARD ---

app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM students');
        const cs = await pool.query('SELECT COUNT(*) FROM students WHERE department_id = 1');
        const business = await pool.query('SELECT COUNT(*) FROM students WHERE department_id = 2');
        const recent = await pool.query(`
            SELECT s.*, d.name as department_name
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            ORDER BY s.id DESC
            LIMIT 5
        `);

        res.json({
            totalStudents: parseInt(total.rows[0].count, 10),
            csStudents: parseInt(cs.rows[0].count, 10),
            businessStudents: parseInt(business.rows[0].count, 10),
            recentStudents: recent.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// --- DEPARTMENTS ---

app.get('/api/departments', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM departments ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// --- STUDENTS ---

// Get all students
app.get('/api/students', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, d.name as department_name
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            ORDER BY s.id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get a single student (used to pre-fill the edit form)
app.get('/api/students/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, d.name as department_name
            FROM students s
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new student
app.post('/api/students', requireAuth, async (req, res) => {
    const { student_id, name, email, phone, department_id, year_level, gpa, enrollment_date } = req.body;

    const errors = validateStudent(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join('. ') });
    }

    try {
        const dup = await pool.query(
            'SELECT id FROM students WHERE student_id = $1 OR email = $2',
            [student_id, email]
        );
        if (dup.rows.length > 0) {
            return res.status(400).json({ error: 'A student with that Student ID or email already exists' });
        }

        const result = await pool.query(
            `INSERT INTO students (student_id, name, email, phone, department_id, year_level, gpa, enrollment_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE))
             RETURNING id`,
            [student_id, name, email, phone || null, department_id, year_level, gpa, enrollment_date || null]
        );

        res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'A student with that Student ID or email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Update an existing student
app.put('/api/students/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { student_id, name, email, phone, department_id, year_level, gpa, enrollment_date } = req.body;

    const errors = validateStudent(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join('. ') });
    }

    try {
        const dup = await pool.query(
            'SELECT id FROM students WHERE (student_id = $1 OR email = $2) AND id != $3',
            [student_id, email, id]
        );
        if (dup.rows.length > 0) {
            return res.status(400).json({ error: 'A student with that Student ID or email already exists' });
        }

        const result = await pool.query(
            `UPDATE students
             SET student_id = $1, name = $2, email = $3, phone = $4,
                 department_id = $5, year_level = $6, gpa = $7,
                 enrollment_date = COALESCE($8, enrollment_date)
             WHERE id = $9
             RETURNING id`,
            [student_id, name, email, phone || null, department_id, year_level, gpa, enrollment_date || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'A student with that Student ID or email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete a student
app.delete('/api/students/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});