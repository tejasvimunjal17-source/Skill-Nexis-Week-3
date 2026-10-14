# Mini Project - Task Manager Application

Skill Nexis Full Stack Web Development (MERN) Internship - Week 3.

A task tracking web app. Users register and log in, then add tasks, change their progress
(To Do / In Progress / Done), edit or delete them, and **filter** the list by status, priority and a search word.
Each user sees only their own tasks.

## Official requirement (week_3.pdf)

> Task Manager Application
> - A complete task tracking web app with user login and task filtering.
> - Frontend in React, backend in Express, and MongoDB for storage.

The practice set (`practice_set.pdf`) adds backend practice items: REST API, Mongoose, CRUD, JWT authentication, Postman testing.

| Requirement | Where it is implemented |
|---|---|
| Task tracking web app | Task list with status and priority, add / edit / delete, status counts (`frontend/src/pages/Tasks.jsx`) |
| User login | Register and log in pages, JWT token, protected pages and API routes |
| Task filtering | Filter bar (status, priority, search) -> backend query (`backend/src/utils/taskFilter.js`) |
| Frontend in React | `frontend/` (React + Vite) |
| Backend in Express | `backend/` |
| MongoDB for storage | Users and tasks are saved with Mongoose (`backend/src/models/`) |
| Practice set: Mongoose, CRUD, JWT | All used. Postman steps are below. |

## Implementation decisions (the PDF does not specify these)

| Decision | Reason |
|---|---|
| A task has a title, description, **status** (`todo`, `in-progress`, `done`) and **priority** (`low`, `medium`, `high`) | The smallest set that makes "task tracking" and "filtering" meaningful |
| "Filtering" = filter by status, by priority, and by a search word in title/description (they can be combined) | The PDF only says "task filtering" |
| Filtering is done by the backend (`GET /api/tasks?status=&priority=&search=`) | Keeps the rules in one place and works with any number of tasks |
| A small summary of task counts per status (`GET /api/tasks/summary`) | Helps tracking progress at a glance |
| Login is reused from Assignment 1 (same code, unchanged) | Already written and reviewed; register does not log in automatically |
| Login token is kept in the browser's `localStorage` | Simple for a learning project |
| No due dates, categories, sharing, pagination or drag-and-drop | Not required; they would make the project harder to run |

## Technology stack

React 18, React Router 6, Axios, Vite - Node.js, Express 4, Mongoose 8, bcrypt, jsonwebtoken, cors - MongoDB.

## Folder structure

```
Mini-Project-Task-Manager/
|-- README.md
|-- .gitignore
|-- .env.example          (explains the two .env files)
|-- backend/
|   |-- server.js, package.json, .env.example, .gitignore
|   |-- src/ (app.js, config/, controllers/, middleware/, models/, routes/, utils/)
|   `-- tests/
`-- frontend/
    |-- index.html, package.json, vite.config.js, vercel.json, .env.example, .gitignore
    |-- src/ (main.jsx, App.jsx, api/, context/, components/, pages/, utils/, styles.css)
    `-- tests/
```

Copied unchanged from Assignment 1 (login system): `User.js`, `authController.js`, `authRoutes.js`, `authMiddleware.js`,
`validateAuth.js`, `generateToken.js`, `checkEnv.js`, `asyncHandler.js`, `errorHandler.js`, `db.js`, `cors.js`, `server.js`,
and on the frontend `AuthContext.jsx`, `ProtectedRoute.jsx`, `Navbar.jsx`, `Login.jsx`, `Register.jsx`, `NotFound.jsx`
(only the page path and the app name were changed). New for this project: everything about tasks.

## Prerequisites

Node.js 18 or newer and a MongoDB database (MongoDB Atlas free tier, or local MongoDB).

## Run on your own computer

**Not yet run by the author** - see "Verification status".

1. In `backend/`: `npm install`, then copy `.env.example` to `.env`, fill in `MONGODB_URI` and `JWT_SECRET`
   (make a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), then `npm start`.
2. In `frontend/` (second terminal): `npm install`, copy `.env.example` to `.env`, then `npm run dev`.
3. Open http://localhost:5173 and register an account.

## Build the frontend for production

In `frontend/`: `npm run build`. This creates the folder `frontend/dist/`, which is what a hosting service serves.
Set `VITE_API_URL` (in `frontend/.env` or in the hosting service's settings) **before** building, because the value is built into the files.
`npm run preview` shows the built files locally. **Not yet run by the author** (installing needs internet).

## Environment variables

| File | Name | Purpose |
|---|---|---|
| backend/.env | `MONGODB_URI` | MongoDB connection string (required) |
| backend/.env | `JWT_SECRET` | Secret for login tokens, 16+ characters (required) |
| backend/.env | `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| backend/.env | `CLIENT_URL` | Frontend address(es) allowed by CORS, comma-separated |
| backend/.env | `PORT` | Backend port (default 5000; hosting services set it themselves) |
| backend/.env | `NODE_ENV` | `development` or `production` |
| frontend/.env | `VITE_API_URL` | Backend address, read at build time |

If `VITE_API_URL` is missing in a deployed build, the app shows a clear message instead of calling `localhost`.

## API endpoints

Protected routes need the header `Authorization: Bearer <token>` (the token comes from the login response).

| Method | Path | Login needed | Purpose |
|---|---|---|---|
| GET | `/` | No | Health message |
| POST | `/api/auth/register` | No | `name`, `email`, `password` (min 6 characters) |
| POST | `/api/auth/login` | No | `email`, `password` -> `token` and `data.user` |
| GET | `/api/auth/profile` | Yes | Current user |
| POST | `/api/tasks` | Yes | Create task: `title` (required, max 100), optional `description` (max 500), `status`, `priority` |
| GET | `/api/tasks` | Yes | List your tasks, newest first. Optional filters: `status` (`todo`, `in-progress`, `done`, or `all`), `priority` (`low`, `medium`, `high`, or `all`), `search` (max 100 characters, case-insensitive, checks title and description) |
| GET | `/api/tasks/summary` | Yes | `{ todo, in-progress, done, total }` for your tasks |
| GET | `/api/tasks/:id` | Yes | One of your tasks |
| PUT / PATCH | `/api/tasks/:id` | Yes | Update any of `title`, `description`, `status`, `priority` |
| DELETE | `/api/tasks/:id` | Yes | Delete one of your tasks |

Examples: `GET /api/tasks?status=done&priority=high` - `GET /api/tasks?search=milk`

Errors look like `{ "success": false, "message": "...", "errors": [ ... ] }`:
`400` invalid input, invalid filter or bad id - `401` missing/invalid/expired token or wrong password -
`404` task not found (also returned for other users' tasks) - `409` email already registered.

### Testing the API with Postman (practice set item 5)

1. `POST {backend}/api/auth/register` with JSON body `{"name":"Ana","email":"ana@example.com","password":"secret123"}` -> expect `201`.
2. `POST {backend}/api/auth/login` with `{"email":"ana@example.com","password":"secret123"}` -> expect `200` and a `token`.
3. In Postman open the **Authorization** tab, choose **Bearer Token**, paste the token (use it for the next requests).
4. `POST {backend}/api/tasks` with `{"title":"Buy milk","priority":"high"}` -> expect `201`.
5. `GET {backend}/api/tasks?priority=high` -> expect your task. `GET {backend}/api/tasks?status=bogus` -> expect `400`.
6. Remove the token and call `GET {backend}/api/tasks` -> expect `401`.

## Verification status (honest report)

Run the backend tests with `npm test` inside `backend/`, and the frontend tests with `npm test` inside `frontend/`.

**A. Tests with mocks or in-memory stand-ins (simulations)**

| Check | Result |
|---|---|
| 14 API tests run through the real route chain (login check, then validation, then controller) with a fake in-memory task store and a fake token checker: all 6 task routes refuse requests without a token, create/validation, filtering through the API, summary, **user B cannot read, change or delete user A's tasks**, owner cannot be reassigned, bad ids, update, delete | 14/14 pass |
| 8 filter-result checks: the built filter applied to sample tasks by a small stand-in for MongoDB (status, priority, case-insensitive search, combinations, other user's tasks excluded, "a.b" searched literally) | 8/8 pass |

**B. Offline tests of plain code (no database, no network, no mocks)**

| Check | Result |
|---|---|
| Task, register and login validation, JWT-secret check, CORS parsing, options: 13 tests | 13/13 pass |
| Filter builder: unknown values, injection shapes such as `status[$ne]=x`, owner cannot be overridden, length limits, special characters: 9 tests | 9/9 pass |
| Frontend helpers (filter parameters, form validation, labels, address cleaning): 9 tests | 9/9 pass |
| **Backend total 44/44, frontend 9/9** | pass |

**Also done during preparation (not included in the ZIP):**
- The code was deliberately broken 7 ways (drop an owner check, drop the user from the filter, remove the login check,
  accept injected filter values, skip search escaping, let clients set the owner, put `/summary` after `/:id`);
  each was caught by failing tests, and the code was then restored.
- The real React components (task form, task item, filter bar, summary, tasks page) were rendered to HTML with real React: 8/8 checks pass.
- Static checks: syntax of all backend files, parse of all frontend files, imports and API paths cross-checked.

**C. Real frontend-backend integration tests:** none were run.

**D. Could NOT be run** (the environment used to build this project had no internet access): `npm install` for either folder,
the production build with real Vite, a real MongoDB connection, real Express/JWT/bcrypt behaviour, React Router navigation
and protected pages, real HTTP requests, login and task management in a browser, CORS in a browser, and any deployment.
Mock tests check this project's own logic, not the real libraries or database. Please try the checklist below and report problems.

## Manual test checklist (after the app is running)

- [ ] Register a new account, then log in
- [ ] Wrong password shows an error; an empty title shows an error
- [ ] Add a task with a title, status and priority; it appears and the counts at the top change
- [ ] Refresh the page: you are still logged in and the task is still there (it came from the database)
- [ ] Change the status from the dropdown on the task; the counts change
- [ ] Edit the task (Save), then delete a task (confirm the question)
- [ ] Add 4-5 tasks with different statuses and priorities, then try each filter: Status, Priority, and Search (try upper and lower case)
- [ ] Combine two filters; try a search with no result ("No tasks match your filters"); tap "Clear filters"
- [ ] Log out, then open `/tasks` directly: you are sent to the login page
- [ ] Register a second account: it must show no tasks and zero counts, never the first account's tasks

## Known limitations

- Not deployed; no live URL. `frontend/vercel.json` is included so page refreshes work when hosting the frontend later.
- The login token is stored in `localStorage` (simple, but not the most secure option).
- No rate limiting on login, no password reset, no email verification.
- No pagination: all matching tasks are loaded at once.
- Search matches text anywhere in the title or description (not word-by-word).
- No `package-lock.json` is included (it can only be created by installing), so installs use the newest versions allowed by `package.json`.
- `bcrypt` is a native library; it normally installs fine, but if an install ever fails on it, tell the mentor.

## Audit changes (compared with the first release, `Skill-Nexis-Week-3-Mini-Project-Task-Manager.zip`)

- `README.md` only: added the "Build the frontend for production" section and the lock-file limitation.
- No source code or dependency was changed. The 44 backend and 9 frontend tests were re-run on this copy (results in `AUDIT-REPORT.md` of the combined package).
