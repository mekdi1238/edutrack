# EduTrack

A small student records system for a university department. Staff log in, then
add, edit, search, and remove student records. There's a dashboard with a few
counts and the most recently added students.

Built as a group project. The backend is Node/Express talking to PostgreSQL, and
the frontend is plain HTML/CSS/JS served as static files from the same server —
no build step, no framework.

## Group members

| Name                  | ID               |
|-----------------------|------------------|
| Mariyamawit Alemseged | 024/BSC-B6/2023  |
| Megdelawit Abraham    | 145/BSC-B6/2023  |
| Munira Tebarek        | 030/BSC-B6/2023  |
| Newal Elias           | 150/BSC-B6/2023  |
| Samuel Girma          | 162/BSC-B6/2023  |

## Features

- Login and registration for staff (registration needs a shared passkey)
- Session-based auth with an HTTP-only cookie; protected API routes return 401
  when you're not logged in
- Dashboard with total students, per-department counts, and the 5 most recent
- Full CRUD on students: list, view, create, update, delete
- Server-side validation (required fields, GPA 0–4, year 1–5, allowed email
  domains, duplicate student-ID/email checks)
- Light/dark theme that's remembered across pages via localStorage

## Technologies used

- **Backend:** Node.js, Express 5, express-session, bcryptjs, pg
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS (custom, with CSS variables for theming), vanilla JS

## Layout

```
backend/
  server.js            Express app: auth, dashboard, students, departments
  database/
    db.js              PostgreSQL connection pool (reads from .env)
    schema.sql         Tables + seed data (departments, admin user, sample students)
  package.json
frontend/
  login.html           Staff login
  register.html        Staff registration (passkey-gated)
  dashboard.html       Counts + recent students
  students.html        Searchable student list
  add-student.html     Create form
  edit-student.html    Edit form
  style.css            Shared styles + dark mode
  theme.js             Theme toggle + persistence
```

The Express server also serves the `frontend/` folder, so the API and the pages
run on the same origin and port. That's why the session cookie works without any
CORS headaches.

## Installation steps

You'll need Node.js and PostgreSQL installed.

1. Create the database and load the schema:

   ```bash
   createdb edutrack
   psql -d edutrack -f backend/database/schema.sql
   ```

2. Add a `.env` file inside `backend/` with your database details:

   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_NAME=edutrack
   SESSION_SECRET=pick-something-random
   PORT=3000
   ```

3. Install dependencies and start the server:

   ```bash
   cd backend
   npm install
   npm start
   ```

4. Open http://localhost:3000 — you'll land on the login page.

## Logging in

The schema seeds one admin account:

- **Username:** `admin`
- **Password:** `admin123`

To register a new staff account you also need the passkey, which is `12345` in
the current code. Both of these are obviously just for development — change them
before this goes anywhere real.

## API

All `/api/students`, `/api/departments`, and `/api/dashboard` routes require a
valid session.

| Method | Route                  | What it does                          |
|--------|------------------------|---------------------------------------|
| POST   | `/api/register`        | Create a staff account (needs passkey)|
| POST   | `/api/login`           | Log in, starts a session              |
| POST   | `/api/logout`          | Destroy the session                   |
| GET    | `/api/me`              | Who am I / am I logged in             |
| GET    | `/api/dashboard/stats` | Counts + recent students              |
| GET    | `/api/departments`     | List departments                      |
| GET    | `/api/students`        | List all students                     |
| GET    | `/api/students/:id`    | One student                           |
| POST   | `/api/students`        | Create a student                      |
| PUT    | `/api/students/:id`    | Update a student                      |
| DELETE | `/api/students/:id`    | Delete a student                      |

## Notes / things to be aware of

- The session cookie is set with `secure: false` for local HTTP. Flip it to
  `true` once you're serving over HTTPS.
- The admin password hash and the registration passkey are committed in
  `schema.sql` / `server.js` for convenience during development. Don't ship them.
- There's no automated test suite yet.

## GitHub repository

https://github.com/mekdi1238/edutrack
