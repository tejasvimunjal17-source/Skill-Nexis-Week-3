# Assignment 1 - Full Stack To-Do Application

Skill Nexis Full Stack Web Development (MERN) Internship - Week 3.

A to-do app where users register, log in, and manage their own to-dos.
The React frontend talks to an Express + MongoDB backend built from the Week 2
To-Do REST API and the Week 2 User Authentication API.

## Official requirement (week_3.pdf)

> Connect Week 2 API with React frontend. Implement authentication, CRUD functionality, and routing.

| Requirement | Where it is implemented |
|---|---|
| React frontend connected to the Week 2 To-Do API | `frontend/src/api/client.js` (Axios) calls `backend/` `/api/todos` |
| Authentication | Register / Login pages, JWT, protected API routes |
| CRUD | Create, list, edit, complete/uncomplete, delete on the To-Do page |
| Routing | React Router: `/login`, `/register`, `/todos` (protected), 404 page |

The week plan also lists protected routes, Context API and form validation; all three are used.

## Implementation decisions (not stated in the PDF)

- Week 2 To-Do API had **no authentication**, so the Week 2 Auth API code was added to a **copy** of it.
- Each to-do now has an owner (`user`); every query is limited to the logged-in user.
- Login token is kept in the browser's `localStorage`. Register does not log in automatically
  (the Week 2 API only returns a token on login).
- Vite is used to build the React app; Axios for API calls; Context API for login state.

## Technology stack

React 18, React Router 6, Axios, Vite - Node.js, Express 4, Mongoose 8, bcrypt, jsonwebtoken, cors - MongoDB.

## Folder structure

```
Assignment-1-Full-Stack-To-Do/
|-- README.md
|-- .gitignore
|-- .env.example          (explains the two .env files)
|-- backend/
|   |-- server.js
|   |-- package.json
|   |-- .env.example
|   |-- src/ (app.js, config/, controllers/, middleware/, models/, routes/, utils/)
|   `-- tests/
`-- frontend/
    |-- index.html, package.json, vite.config.js, vercel.json, .env.example
    `-- src/ (main.jsx, App.jsx, api/, context/, components/, pages/, styles.css)
```

## Prerequisites

- Node.js 18 or newer
- A MongoDB database (MongoDB Atlas free tier, or local MongoDB)

## Run on your own computer (optional)

Needs Node.js 18+ and a MongoDB database. **Not yet run by the author** - see "Verification status".

1. In `backend/`: `npm install`, then copy `.env.example` to `.env`, fill in `MONGODB_URI` and `JWT_SECRET`
   (make a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), then `npm start`.
2. In `frontend/` (second terminal): `npm install`, copy `.env.example` to `.env`, then `npm run dev`.
3. Open http://localhost:5173

## Environment variables (exact names)

| Where | Name | Purpose |
|---|---|---|
| Backend (Render) | `MONGODB_URI` | MongoDB Atlas connection string (required) |
| Backend (Render) | `JWT_SECRET` | Secret for login tokens, 16+ characters (required) |
| Backend (Render) | `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| Backend (Render) | `CLIENT_URL` | Your Vercel address, e.g. `https://my-app.vercel.app` (no slash at the end needed; one is removed automatically) |
| Backend (Render) | `NODE_ENV` | `production` |
| Backend (Render) | `PORT` | **Do not set on Render** - Render provides it. Defaults to 5000 locally. |
| Frontend (Vercel) | `VITE_API_URL` | Your Render address, e.g. `https://my-api.onrender.com`. Read at **build time**: after changing it you must redeploy. |

If `VITE_API_URL` is missing in a deployed build, the app shows a clear "not configured" message instead of
silently calling `localhost`.

## Deployment guide (MongoDB Atlas + Render + Vercel)

Menu names on these websites change from time to time. If a button is named differently, look for the closest one.
Never paste passwords or secrets into chat, README files or GitHub.

### 0. Put the project on GitHub
Render and Vercel both deploy from a GitHub repository. The repository's top level must contain the
`backend` and `frontend` folders (so upload the *contents* of `Assignment-1-Full-Stack-To-Do`, not the ZIP itself).
Do not upload any `.env` file.

### 1. MongoDB Atlas (database)
1. Sign up at cloud.mongodb.com and create a **free (M0)** cluster.
2. **Database Access** -> **Add New Database User** -> choose a username and a password made only of letters and numbers
   (special characters must be URL-encoded inside the connection string). Keep the password private.
3. **Network Access** -> **Add IP Address** -> **Allow access from anywhere** (`0.0.0.0/0`). Render's free service has no fixed IP.
4. **Database** -> **Connect** -> **Drivers** -> copy the connection string. Replace `<password>` with your password and add
   the database name before the `?`, like `...mongodb.net/fullstack_todo_db?retryWrites=true...`.
   This full text is your `MONGODB_URI`.

### 2. Render (backend)
1. **New** -> **Web Service** -> connect your GitHub repository.
2. Settings: **Root Directory** `backend` - **Build Command** `npm install` - **Start Command** `npm start` - **Instance type** Free.
3. Add the environment variables `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV` (see table).
   For `CLIENT_URL` type any placeholder for now; you will fix it in step 4.
4. Create the service and wait for "Live". Open your Render address in a browser: it should show a short JSON message
   saying the API is running. If it does not, open the **Logs** tab and read the last error.

### 3. Vercel (frontend)
1. **Add New** -> **Project** -> import the same repository.
2. **Root Directory** `frontend`. Framework should be detected as **Vite** (build command `npm run build`, output folder `dist`).
3. Add the environment variable `VITE_API_URL` = your Render address (starting with `https://`).
4. **Deploy**. `frontend/vercel.json` makes page refreshes on `/todos` work.

### 4. Connect them
Copy your Vercel address, set it as `CLIENT_URL` on Render, and save (Render restarts the service).
If the browser later says it cannot reach the server, check these two values first.

Notes: the Render free service sleeps when unused, so the first request can take about a minute.

## Testing checklist (do this after deploying)

- [ ] Backend address shows the "API is running" message
- [ ] Register a new account, then log in
- [ ] Add a to-do; it appears in the list
- [ ] Refresh the page; you are still logged in and the to-do is still there
- [ ] Edit the to-do; tick it as done; untick it
- [ ] Delete the to-do
- [ ] Log out, then open `/todos` directly: you are sent to the login page
- [ ] Register a second account: it must NOT show the first account's to-dos
- [ ] Wrong password shows an error message; empty title shows an error message

## API endpoints

| Method | Path | Login needed | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account (`name`, `email`, `password`) |
| POST | `/api/auth/login` | No | Returns `token` and `data.user` |
| GET | `/api/auth/profile` | Yes | Current user |
| POST | `/api/todos` | Yes | Create to-do (`title`, optional `description`) |
| GET | `/api/todos` | Yes | List your to-dos |
| GET | `/api/todos/:id` | Yes | Get one of your to-dos |
| PUT / PATCH | `/api/todos/:id` | Yes | Update `title`, `description`, `completed` |
| DELETE | `/api/todos/:id` | Yes | Delete one of your to-dos |

Protected routes need the header `Authorization: Bearer <token>`.

## Changes from the Week 2 code (in this Week 3 copy only)

- `backend/src/models/Todo.js`: added required `user` field.
- `backend/src/routes/todoRoutes.js`: all routes use the `protect` middleware.
- `backend/src/controllers/todoController.js`: every query filtered by `req.user._id`.
- `backend/src/app.js`: added CORS and `/api/auth` routes.
- `backend/src/middleware/errorHandler.js`: merged with the Auth API's duplicate-email handling.
- `backend/server.js`: added the JWT secret check from the Auth API.
- Copied unchanged from the Auth API: `User.js`, `authController.js`, `authRoutes.js`,
  `authMiddleware.js`, `validateAuth.js`, `checkEnv.js`, `generateToken.js`.
- New: the whole `frontend/` folder (including `vercel.json`), `backend/src/config/cors.js`, `.env.example` entries `CLIENT_URL`/`JWT_*`, and `backend/tests/`.

## Verification status (honest report)

Run the offline tests with `npm test` inside `backend/`.

| Check | Type | Result |
|---|---|---|
| Validation rules (to-do, register, login, JWT-secret check) - 13 tests | Offline automated | 13/13 pass |
| CORS address parsing - 3 tests | Offline automated | 3/3 pass |
| Login-token middleware (missing, wrong type, forged, expired, deleted user, valid) and route wiring (all to-do routes protected, register/login public, routers mounted at the paths the frontend calls) - 9 tests | Mock test (fake express, jwt and database) | 9/9 pass |
| Every to-do query limited to the logged-in user - 5 tests | Mock test (fake database model) | 5/5 pass |
| Total | | 30/30 pass |
| Syntax check of backend files, parse check of React files, import names and API paths cross-checked | Static | pass |
| Passwords hashed with bcrypt before saving and never returned; JWT signed with `JWT_SECRET` | Code inspection only | looks correct, not run |

**Not verified yet:** `npm install` (either folder), the frontend production build, a real MongoDB connection,
real HTTP requests, login and CRUD in a browser, CORS in a browser, and the deployment itself.
The environment used to prepare this project had no internet access. Mock tests check this project's own logic,
not the real libraries or database.

## Known limitations

- Not deployed yet; there is no live URL.
- Login token is stored in the browser's `localStorage` (simple, but not the most secure option).
- No rate limiting on login, no password reset, no email verification.
- Atlas must allow access from anywhere (`0.0.0.0/0`) because the free Render service has no fixed IP.
- `bcrypt` is a native library. It normally installs fine on Render; if the Render build log shows a `bcrypt` error, tell the mentor.
- Only one frontend address pattern is allowed by CORS per entry in `CLIENT_URL`; Vercel preview URLs are not included.
- To-do filtering and search are not part of the official Assignment 1 requirements and are not included.
