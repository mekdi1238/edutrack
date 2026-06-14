# EduTrack — Project Documentation

**Course project — BSC-B6/2023**

A student records management system for a university department. Authorized staff
sign in and manage student records (create, read, update, delete), with a
dashboard summarizing the data.

| | |
|---|---|
| Repository | https://github.com/mekdi1238/edutrack |
| Stack | Node.js + Express, PostgreSQL, vanilla HTML/CSS/JS |
| Auth | Session-based (HTTP-only cookie) |

## Group members

| Name | ID |
|------|----|
| Mariyamawit Alemseged | 024/BSC-B6/2023 |
| Megdelawit Abraham | 145/BSC-B6/2023 |
| Munira Tebarek | 030/BSC-B6/2023 |
| Newal Elias | 150/BSC-B6/2023 |
| Samuel Girma | 162/BSC-B6/2023 |

---

## 1. Architecture

The system has three layers running together:

```
Browser (frontend/*.html + style.css + theme.js)
        |  fetch() calls to /api/*  (cookies included)
        v
Express server (backend/server.js)
        |  SQL via pg connection pool
        v
PostgreSQL database (departments, users, students)
```

**Key design points**

- The Express server **serves the frontend as static files** from the same
  origin and port as the API (`express.static('../frontend')`). Because the pages
  and the API share one origin, the session cookie works without cross-origin
  complications.
- **Authentication** uses `express-session`. On successful login a session is
  created and stored in an HTTP-only cookie. Protected routes call a
  `requireAuth` middleware that returns `401` if no session exists.
- **Passwords** are hashed with bcrypt before being stored; plain passwords are
  never saved.
- **Validation** happens on the server (`validateStudent`) and is mirrored on the
  client for instant feedback.

**Folder layout**

```
backend/
  server.js              Express app and all routes
  database/db.js         PostgreSQL connection pool
  database/schema.sql    Schema + seed data
frontend/
  login.html             Staff login
  register.html          Staff registration (passkey-gated)
  dashboard.html         Summary counts + recent students
  students.html          Searchable student list
  add-student.html       Create form
  edit-student.html      Edit form
  style.css              Shared styles + dark mode
  theme.js               Theme toggle and persistence
```

---

## 2. Database schema

Three tables in PostgreSQL.

**departments**

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Unique, not null |

**users** (staff accounts)

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| username | VARCHAR(50) | Unique, not null |
| password | VARCHAR(255) | bcrypt hash, not null |
| full_name | VARCHAR(100) | Not null |
| role | VARCHAR(20) | Default `staff` |

**students**

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | Primary key |
| student_id | VARCHAR(20) | Unique, not null |
| name | VARCHAR(100) | Not null |
| email | VARCHAR(100) | Unique, not null |
| phone | VARCHAR(20) | Optional |
| department_id | INTEGER | References `departments(id)` |
| year_level | INTEGER | Not null, must be 1–5 |
| gpa | NUMERIC(3,2) | Not null, must be 0–4 |
| enrollment_date | DATE | Defaults to current date |

**Seed data** (loaded by `schema.sql`)

- Departments: Computer Science, Business, Engineering, Mathematics
- One admin user — `admin` / `admin123`
- Five sample students

---

## 3. API reference

Base URL: `http://localhost:3000`. Routes marked **Auth** require a valid session
cookie; without one they return `401 { "error": "Not authenticated" }`.

### Authentication

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/register` | No | `full_name, username, password, passkey` | Create a staff account. Requires the shared passkey. |
| POST | `/api/login` | No | `username, password` | Log in; starts a session. |
| POST | `/api/logout` | No | — | Destroys the session. |
| GET | `/api/me` | No | — | Returns `{ authenticated, user }`. |

### Dashboard & departments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | Yes | Total students, per-department counts, 5 most recent. |
| GET | `/api/departments` | Yes | List of departments. |

### Students

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | Yes | List all students (with department name). |
| GET | `/api/students/:id` | Yes | Get one student. |
| POST | `/api/students` | Yes | Create a student. |
| PUT | `/api/students/:id` | Yes | Update a student. |
| DELETE | `/api/students/:id` | Yes | Delete a student. |

**Student payload** (create/update)

```json
{
  "student_id": "STU2026001",
  "name": "Jane Doe",
  "email": "jane@gmail.com",
  "phone": "0911000000",
  "department_id": 1,
  "year_level": 3,
  "gpa": 3.5,
  "enrollment_date": "2026-09-01"
}
```

**Validation rules** (server-side)

- `student_id`, `name`, `email`, `department_id` are required.
- Email domain must be one of: gmail.com, yahoo.com, hotmail.com, outlook.com,
  icloud.com.
- `year_level` must be between 1 and 5.
- `gpa` must be between 0 and 4.00.
- Duplicate `student_id` or `email` is rejected.

---

## 4. User guide (for staff)

**Logging in**

1. Open the site; you land on the login page.
2. Enter your username and password and submit.
3. Default admin account for testing: `admin` / `admin123`.

**Registering a new staff account**

1. From the login page, follow the link to register.
2. Fill in your full name, username, and password.
3. Enter the shared **passkey** (`12345` in the current build) and submit.

**Dashboard**

After login you see totals (all students, per department) and the five most
recently added students.

**Managing students**

- **View / search:** the Students page lists all records; use the search box to
  filter.
- **Add:** open the Add Student form, fill in the fields, and save. Invalid
  fields show an inline message.
- **Edit:** from the list, choose Edit; the form is pre-filled. Change fields and
  save.
- **Delete:** from the list, choose Delete to remove a record.

**Dark mode**

Every page has a theme toggle in the nav bar. Your choice is remembered across
pages and sessions.

---

## 5. Running the project locally

Requires Node.js and PostgreSQL.

```bash
# 1. Create the database and load schema + seed data
createdb edutrack
psql -d edutrack -f backend/database/schema.sql

# 2. Create backend/.env
#    DB_HOST=localhost
#    DB_PORT=5432
#    DB_USER=postgres
#    DB_PASSWORD=yourpassword
#    DB_NAME=edutrack
#    SESSION_SECRET=something-random
#    PORT=3000

# 3. Install and run
cd backend
npm install
npm start
```

Then open http://localhost:3000.

---

## 6. Request / response examples

Concrete examples of what the API expects and returns.

**Login — success**

```
POST /api/login
Content-Type: application/json

{ "username": "admin", "password": "admin123" }
```
```
200 OK
Set-Cookie: connect.sid=...; HttpOnly
{ "success": true, "user": { "id": 1, "username": "admin",
  "full_name": "Admin User", "role": "admin" } }
```

**Login — bad credentials**

```
401 Unauthorized
{ "error": "Invalid credentials" }
```

**Create a student — success**

```
POST /api/students        (requires session cookie)
{ "student_id": "STU2026010", "name": "Sara M", "email": "sara@gmail.com",
  "department_id": 1, "year_level": 2, "gpa": 3.6 }
```
```
200 OK
{ "success": true, "id": 12 }
```

**Create a student — validation failure**

```
400 Bad Request
{ "error": "GPA must be between 0 and 4.00. Year level must be between 1 and 5" }
```

**Dashboard stats**

```
GET /api/dashboard/stats        (requires session cookie)
```
```
200 OK
{ "totalStudents": 6, "csStudents": 3, "businessStudents": 2,
  "recentStudents": [ { "id": 12, "student_id": "STU2026010",
    "name": "Sara M", "department_name": "Computer Science", "gpa": "3.60", ... } ] }
```

### HTTP status codes used

| Code | Meaning in this app |
|------|---------------------|
| 200 | Success |
| 400 | Missing/invalid fields, or duplicate student ID/email |
| 401 | Not logged in, or wrong login/passkey |
| 404 | Student not found (`GET/PUT/DELETE /api/students/:id`) |
| 500 | Unexpected server/database error |

---

## 7. Frontend page reference

Each page is a standalone HTML file with an inline `<script>` that talks to the
API with `fetch(..., { credentials: 'include' })`. Every protected page runs an
auth check on load and redirects to `login.html` if there is no session.

| Page | Purpose | Key behavior |
|------|---------|--------------|
| `login.html` | Sign in | If already logged in, auto-redirects to dashboard. Enter key submits. |
| `register.html` | Create staff account | Requires the shared passkey; redirects to login on success. |
| `dashboard.html` | Overview | Loads stats, shows recent students, runs a live clock (updates every second). |
| `students.html` | Student list | Loads all students once into memory, then filters client-side by name/ID/email. Edit and Delete buttons per row; delete asks for confirmation. |
| `add-student.html` | Create form | Client-side validation with inline field errors, then `POST /api/students`. |
| `edit-student.html` | Update form | Reads `?id=` from the URL, pre-fills the form via `GET /api/students/:id`, then `PUT`s changes. |

**Shared frontend pieces**

- `style.css` — design system using CSS custom properties (`--primary`, `--bg`,
  `--surface`, etc.). A `html[data-theme="dark"]` block overrides the variables
  for dark mode. Covers nav, forms, buttons, tables, stat cards, and is
  responsive (single-column forms under 500px).
- `theme.js` — applies the saved theme on load, `toggleTheme()` flips it and
  saves to `localStorage` under the key `edutrack-theme`, and the toggle button
  label updates accordingly.

**XSS note:** list rendering builds table rows from API data, so every value is
passed through an `escapeHtml()` helper before being inserted into the DOM.

---

## 8. How a request flows (login example)

1. User submits the login form; `login()` sends `POST /api/login` with
   `credentials: 'include'`.
2. The server looks up the username, compares the password with the stored bcrypt
   hash using `bcrypt.compare()`.
3. On a match it saves `req.session.user` and the session middleware sets an
   HTTP-only cookie on the response.
4. The browser stores the cookie and redirects to `dashboard.html`.
5. The dashboard calls `GET /api/me` and `GET /api/dashboard/stats`, automatically
   sending the cookie. `requireAuth` sees a valid session and allows the requests.
6. Logout calls `POST /api/logout`, which destroys the session; subsequent
   protected calls then return `401` and the page redirects back to login.

---

## 9. Security & validation summary

- **Password storage:** bcrypt hashing (cost factor 10); raw passwords are never
  persisted or logged.
- **Sessions:** HTTP-only cookie (`httpOnly: true`) so JavaScript cannot read it;
  `sameSite: 'lax'`; one-hour expiry (`maxAge: 3600000`).
- **Route protection:** `requireAuth` middleware guards all student, department,
  and dashboard endpoints.
- **Registration gate:** new accounts require a shared passkey, so not just anyone
  can self-register.
- **Server-side validation:** all student input is validated on the server
  (`validateStudent`) regardless of client checks — required fields, GPA range,
  year range, allowed email domains.
- **Duplicate protection:** unique constraints on `student_id` and `email` at the
  database level, plus an explicit pre-check that returns a friendly 400; the
  Postgres unique-violation code `23505` is also handled.
- **SQL injection:** all queries use parameterized placeholders (`$1, $2, ...`),
  never string concatenation.
- **XSS:** user-supplied values are escaped before being rendered into tables.

---

## 10. Notes & limitations

- The admin password and registration passkey are for development only and are
  visible in `schema.sql` / `server.js`. Change them before any real deployment.
- The session cookie uses `secure: false` for local HTTP; set it to `true` when
  serving over HTTPS.
- No automated test suite is included.
