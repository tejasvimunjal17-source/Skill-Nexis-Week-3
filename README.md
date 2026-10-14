# Skill Nexis Week 3 - Full Stack Integration Projects (all three)

Skill Nexis Full Stack Web Development (MERN) Internship, Week 3: connecting a React frontend to an Express backend and a MongoDB database.

This package holds **three independent projects**. Each has its own backend, frontend, dependencies, README and `.env.example`.
Nothing is shared between them, so any folder can be copied or deployed on its own.

> **Honest status:** all three projects are written and have passed their offline tests. **None has been installed with `npm install`,
> connected to a real MongoDB database, opened in a browser, or deployed**, because the build environment had no internet access.
> Nothing here is claimed to "work in production". See section 10 and `AUDIT-REPORT.md`.

## 1. What is in this package

| Folder | Purpose | Version note |
|---|---|---|
| `Assignment-1-Full-Stack-To-Do/` | Register, log in, and manage your own to-dos (create, read, update, delete) | First release, unchanged |
| `Assignment-2-Image-Upload/` | Choose an image, preview it, upload it with Multer, see it in a gallery | **Audited version** (Multer 2.x, build instructions added) |
| `Mini-Project-Task-Manager/` | Task tracking app with login and task filtering (status, priority, search) | **Audited version** (build instructions added) |
| `AUDIT-REPORT.md` | Detailed audit: requirements, test results, findings, fingerprints | - |
| `README.md` | This file | - |

## 2. Official requirements (week_3.pdf) and how each project meets them

| Project | Official requirement | Where it is done |
|---|---|---|
| Assignment 1 | Connect the Week 2 API with a React frontend; implement authentication, CRUD functionality and routing | React app in `frontend/` calls the To-Do API in `backend/` (Week 2 API plus Week 2 login code); JWT login; create/list/edit/delete; React Router with a protected page |
| Assignment 2 | Create a file upload endpoint using Multer; integrate with React to preview and display uploaded images | `POST /api/images` with Multer; preview before upload; gallery after upload |
| Mini Project | A complete task tracking web app with user login and task filtering; React frontend, Express backend, MongoDB storage | Tasks with status and priority; login; filter by status, priority and search; Mongoose models |

The week's topic list (Axios, React Router and protected routes, Context API, form validation, Multer) is covered across the projects.
The practice set (REST API, Mongoose, CRUD, JWT, Postman) is covered by the backends; the Mini Project README has a Postman walk-through.

The PDF does not say how filtering should work, whether Assignment 2 needs a login, or where uploaded images should be stored.
Those choices are the author's **implementation decisions** and are listed in each project's README (for example: images are stored in MongoDB,
because free hosting services erase files saved on the server).

## 3. Technologies

| Project | Frontend | Backend | Database |
|---|---|---|---|
| Assignment 1 | React 18, React Router 6, Axios, Vite | Node.js, Express 4, Mongoose 8, bcrypt, jsonwebtoken, cors | MongoDB |
| Assignment 2 | React 18, Axios, Vite | Node.js, Express 4, Multer 2, Mongoose 8, cors | MongoDB |
| Mini Project | React 18, React Router 6, Axios, Vite | Node.js, Express 4, Mongoose 8, bcrypt, jsonwebtoken, cors | MongoDB |

## 4. Folder structure

```
Skill-Nexis-Week-3/
|-- README.md                       (this file)
|-- AUDIT-REPORT.md
|-- .gitignore
|-- Assignment-1-Full-Stack-To-Do/
|-- Assignment-2-Image-Upload/
`-- Mini-Project-Task-Manager/
      each project folder contains:
      |-- README.md, .gitignore, .env.example
      |-- backend/   (server.js, package.json, .env.example, src/, tests/)
      `-- frontend/  (index.html, package.json, vite.config.js, .env.example, src/, and tests/ where present)
```

## 5. Before you start

- **Node.js 18 or newer** (includes `npm`). Check with `node -v`.
- **A MongoDB database**: a free MongoDB Atlas cluster or MongoDB installed on your computer. You need its connection string.
- These commands need a computer (or any place where Node.js runs). Never run `npm install` in the master folder: always inside a project's `backend/` or `frontend/` folder.

## 6. Run a project

The steps are the same for all three. Replace `<project>` with the folder name. Use two terminals.

**Backend**
```
cd <project>/backend
npm install
cp .env.example .env
```
Open `.env` in a text editor and fill in the values (see section 7). Then:
```
npm start
```
Success: the terminal prints `Server running on port 5000`. Opening http://localhost:5000 shows a short JSON message.

**Frontend** (second terminal)
```
cd <project>/frontend
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:5173.

**Build the frontend for production** (optional): `npm run build` inside `frontend/` creates `frontend/dist/`.
Set `VITE_API_URL` before building, because it is built into the files.

**Running two projects at once:** all three use the same default ports (backend 5000, frontend 5173).
Run one project at a time, or change the ports (`PORT` in `backend/.env`, `npm run dev -- --port 5174` for the frontend,
and then update `VITE_API_URL` and `CLIENT_URL` to match).

## 7. Environment variables

Never put real values in `.env.example`, in a README, or in a ZIP. The real `.env` files are ignored by `.gitignore`.

| Project | File | Names |
|---|---|---|
| Assignment 1 | `backend/.env` | `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `PORT`, `NODE_ENV` |
| Assignment 2 | `backend/.env` | `MONGODB_URI`, `CLIENT_URL`, `PORT`, `NODE_ENV` |
| Mini Project | `backend/.env` | `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `PORT`, `NODE_ENV` |
| All three | `frontend/.env` | `VITE_API_URL` (the backend address, no slash at the end) |

- `MONGODB_URI`: your database connection string (each project's example suggests its own database name).
- `JWT_SECRET`: a long private random text, at least 16 characters. Make one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. The server refuses to start with a missing or placeholder secret.
- `CLIENT_URL`: the address of the React app that may call the backend (default `http://localhost:5173`).
- If `VITE_API_URL` is missing in a deployed build, the app shows a clear "not configured" message instead of silently calling `localhost`.

## 8. API endpoints

Protected routes need the header `Authorization: Bearer <token>` (the token is returned by login).

**Assignment 1 - To-Do API**

| Method | Path | Login | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Returns a token |
| GET | `/api/auth/profile` | Yes | Current user |
| POST / GET | `/api/todos` | Yes | Create / list your to-dos |
| GET / PUT / PATCH / DELETE | `/api/todos/:id` | Yes | One of your to-dos |

**Assignment 2 - Image API** (no login)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/images` | Upload one image (form field `image`; JPEG, PNG, GIF or WebP; max 2 MB) |
| GET | `/api/images` | List the newest 50 images |
| GET | `/api/images/:id/file` | The picture itself |

**Mini Project - Task Manager API**

| Method | Path | Login | Purpose |
|---|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | No | Same login system as Assignment 1 |
| GET | `/api/auth/profile` | Yes | Current user |
| POST | `/api/tasks` | Yes | Create a task (title, description, status, priority) |
| GET | `/api/tasks?status=&priority=&search=` | Yes | List your tasks, filtered |
| GET | `/api/tasks/summary` | Yes | Number of tasks per status |
| GET / PUT / PATCH / DELETE | `/api/tasks/:id` | Yes | One of your tasks |

Full details, error codes and Postman steps are in each project's README.

## 9. Run the tests

The tests use Node's built-in test runner, need no database and no internet, and run from inside a project's `backend/` or `frontend/` folder:
```
npm test
```

| Project | Backend | Frontend |
|---|---|---|
| Assignment 1 | 30 tests | no test folder (components were render-checked during the audit) |
| Assignment 2 | 33 tests | 9 tests |
| Mini Project | 44 tests | 9 tests |

All of these passed in the audit environment (Node 22). They have not been re-run after a real `npm install`.

## 10. What has and has not been verified

| Level | What it means | Status |
|---|---|---|
| A. Offline code tests (real code, no mocks) | validation rules, file-type detection from real file bytes, filter builder, helper functions | **Passed** in all three projects |
| B. Simulated tests (mocks) | Express, Multer, the token library and the database replaced by small fakes; checks this project's own logic such as "user B cannot touch user A's data" | **Passed**, but they do **not** prove real behaviour |
| C. Render checks | the real React components turned into HTML in a test script (React 19 was available in the sandbox; the projects declare React 18) | **Passed** for all three; not a browser |
| D. Real services | `npm install`, the real Vite build, real MongoDB, real Multer / Express / JWT / bcrypt, React Router in a browser, real HTTP calls, login/CRUD/upload/filtering in a browser, CORS | **Not run** (no internet in the build environment) |
| E. Deployment | hosting | **Not done** |

Please use the manual test checklist in each project's README the first time you run a project, and report any error message.

## 11. Known limitations

- No `package-lock.json` in any project (a lock file can only be created by installing), so installs use the newest versions allowed by each `package.json`. Run `npm audit` after installing.
- The login token (Assignments 1 and the Mini Project) is kept in the browser's `localStorage`.
- No login rate limiting, no password reset, no email verification.
- **Assignment 2 has no login**: anyone who can reach its backend can upload and see all images. There is no delete button.
- Assignment 2 stores images in MongoDB; the free Atlas tier is limited (512 MB), hence the 2 MB per image limit.
- The Mini Project has no pagination. Assignment 1 has no filtering (not required).
- `bcrypt` is a native library; if an install ever fails on it, report the error.

## 12. Security considerations

In place (checked by reading the code and by offline or simulated tests):
- Passwords are hashed with bcrypt and never returned by the API.
- Login tokens are signed with `JWT_SECRET`; the server refuses to start without a proper secret.
- Private routes check the token; every to-do/task query is limited to the logged-in user, and the owner cannot be set by the client.
- Input is validated (types, lengths, allowed values, ids); filter values must be plain text, which blocks injected database operators.
- Uploads: allowed types only, 2 MB limit, the real file type is read from the file's bytes, SVG is refused, picture data is stored in the database (never written to server folders), file names are cleaned and shown as plain text.
- CORS allows only the addresses listed in `CLIENT_URL`; JSON request bodies are limited to 10 KB.
- No secrets, `.env` files or `node_modules` are included in this package.

Not in place: rate limiting, account lock-out, HTTP-only cookies, a security-header package, and any check by real security tools.

## 13. Notes for the future deployment phase (not started)

- Deploy the projects **one at a time**; each backend and frontend deploys separately.
- Backend: use the folder `backend`, install with `npm install`, start with `npm start`; the hosting service supplies `PORT`.
- Frontend: use the folder `frontend`, build with `npm run build`, publish the folder `dist`; set `VITE_API_URL` **before** the build and rebuild after changing it.
- Set `CLIENT_URL` on the backend to the deployed frontend address exactly (no path).
- `frontend/vercel.json` (Assignments 1 and the Mini Project) makes page refreshes work on pages that use React Router.
- Free hosting limits (sleeping services, database size) should be re-checked at deployment time.
- Test each deployed project with its README checklist, including the two-user test for the projects with login.

## 14. About the versions in this package

`AUDIT-REPORT.md` explains the audit. In short: Assignment 1 is the first release; Assignment 2 was corrected (its Multer dependency was
deprecated with known vulnerabilities and was changed to 2.x; build instructions were added); the Mini Project received only a README addition.
The first-release ZIPs of all three projects were kept unchanged.
