# Final Audit Report - Skill Nexis Week 3 (all projects)

Audit date: 2026-10-13. Audited items: the three final project ZIPs, extracted into fresh folders (not the original working folders).

## 1. Scope and limits of this audit

- Official sources re-read: the real `week 3.pdf` and `practice set.pdf` inside the uploaded `week_3.zip` (the plain-text copies in the project have the same wording).
- Environment: Node.js v22.22.2, **no internet access**. `npm ping` and a direct request to the npm registry both failed, so **no `npm install` and no real Vite build could be run for any project.**
- Therefore every "passed" below is one of: offline test of plain code, simulated test (mocks), render check, or static check. **None is a real integration test.**
- Not available in the environment and therefore not run: real MongoDB, real Express/JWT/bcrypt/Multer libraries, React Router, Vite, a browser, HTTP between frontend and backend, `npm audit`.

## 2. Official requirements checklist

Legend: **O** = official requirement (from the PDF); **D** = author's implementation decision (not in the PDF).
Evidence: **code** = offline test of plain code; **sim** = simulated (mock) test; **render** = real React components rendered to HTML (React 19.2.5 in the sandbox; projects declare React 18.3.1); **static** = syntax/import/path checks.
"Real environment" is **unverified** everywhere, because no real service or browser was available.

### Assignment 1 - Full Stack To-Do (first release)
| # | Requirement | Type | Implemented in | Evidence | Real environment |
|---|---|---|---|---|---|
| 1 | React frontend connected to the Week 2 To-Do API | O | `frontend/src/api/client.js` (Axios) to `/api/todos`; backend is a copy of the Week 2 To-Do API | static (all API paths match backend routes), render | unverified |
| 2 | Authentication | O | register/login, bcrypt, JWT, `protect` middleware (Week 2 login code reused) | code (validation), sim (token checks, route wiring) | unverified |
| 3 | CRUD functionality | O | create / list / edit / complete / delete in the UI and API | sim (5 ownership tests), render | unverified |
| 4 | Routing | O | React Router: `/login`, `/register`, `/todos` (protected), 404 page | static only (React Router is not installed here, so the router was never rendered) | unverified |
| 5 | Topics: protected routes, Context API, form validation, Axios | O (topic list) | `ProtectedRoute.jsx`, `AuthContext.jsx`, form checks, Axios | static, render | unverified |
| 6 | Week 2 API had no login; login added to a copy; every to-do has an owner; token in `localStorage` | D | `backend/` | sim | unverified |

### Assignment 2 - Image Upload (audited version)
| # | Requirement | Type | Implemented in | Evidence | Real environment |
|---|---|---|---|---|---|
| 1 | Upload endpoint using Multer | O | `POST /api/images`, `middleware/uploadImage.js` | sim (Multer replaced by a fake: configuration and wiring checked), code (file type read from real PNG/JPEG/GIF/WebP bytes; text, HTML, SVG, WAV refused) | unverified (real Multer never run) |
| 2 | Preview in React | O | `UploadForm.jsx` (preview before upload) | code (file checks), render shows the form only; the preview appears after a file is chosen, which no test could exercise | unverified |
| 3 | Display uploaded images | O | `ImageGallery.jsx`, `GET /api/images/:id/file` | render (gallery with an image, empty and error states, escaped names), sim (file route) | unverified |
| 4 | Store images in MongoDB, 2 MB limit, 4 image types, no login | D | backend | code, sim | unverified |

### Mini Project - Task Manager (audited version)
| # | Requirement | Type | Implemented in | Evidence | Real environment |
|---|---|---|---|---|---|
| 1 | Task tracking web app | O | task list with status/priority, add/edit/delete, summary counts | sim, render | unverified |
| 2 | User login | O | same login system as Assignment 1; protected page and routes | sim (all 6 task routes refuse requests without a token) | unverified |
| 3 | Task filtering | O | filter bar to `GET /api/tasks?status=&priority=&search=` | code (filter builder), sim (filter results through the API; 8 filter-result checks) | unverified |
| 4 | React frontend, Express backend | O | `frontend/`, `backend/` | static, render | unverified |
| 5 | MongoDB for storage | O | Mongoose models `User`, `Task` | static only (real database never connected) | unverified |
| 6 | Practice set: REST API, Mongoose, CRUD, JWT, Postman | O (practice) | backend; Postman steps in the README | sim | unverified |
| 7 | Meaning of "filtering" (status, priority, search); status/priority fields; summary counts | D | backend + frontend | sim | unverified |

## 3. Test results (all re-run on fresh extracts for this audit)

| Project | Backend | Frontend tests | Render check | Syntax / parse |
|---|---|---|---|---|
| Assignment 1 (first release) | 30 / 30 pass (13 validation + 3 CORS = code; 9 security + 5 ownership = sim) | none in project | 4 / 4 pass | pass |
| Assignment 2 (audited) | 33 / 33 pass (9 file-signature + 14 rules = code; 10 = sim) | 9 / 9 pass | 7 / 7 pass | pass |
| Mini Project (audited) | 44 / 44 pass (13 validation + 9 filter builder = code; 8 filter-result + 14 API-flow = sim) | 9 / 9 pass | 8 / 8 pass | pass |

Failures: none. Skipped checks: everything in section 1 that needs internet or a browser.
During the build phase (not repeated in this audit), each project's key tests were checked by deliberately breaking the code (Assignment 2: 4 ways, Mini Project: 7 ways, Assignment 1: removal of the login guard); every change was caught by a failing test and the code was restored.

Other automated audit checks (all three projects, on fresh extracts):
- **Dependencies:** every package used by the source is declared in `package.json`; no declared dependency is unused; Vite and its React plugin are declared. (Declared is not the same as installed.)
- **Environment variables:** every variable read by the backend code is in `backend/.env.example` and mentioned in the README; the frontend reads only `VITE_API_URL`, which is in `frontend/.env.example`.
- **Self-contained:** no import leaves its project folder; no code or JSON mentions another project.
- **Deployment configuration:** frontends read the API address from `VITE_API_URL`; `localhost` is used only as a development default; a deployed build without `VITE_API_URL` shows a clear error instead of calling localhost.
- **Package hygiene:** no `node_modules`, `.env`, logs or build folders; a secret-pattern search found nothing.

## 4. Findings

| ID | Project | Finding | Severity | Action |
|---|---|---|---|---|
| F1 | Assignment 2 | `multer` was declared as `^1.4.5-lts.1`. npm marks Multer 1.x as deprecated and the Express team's May 2025 security announcement lists denial-of-service vulnerabilities in versions below 2.0.0; later advisories ask for newer 2.x releases. | High (dependency security) | **Fixed in the audited copy:** `^2.3.0`. The code only uses standard Multer features, but real Multer 2.x was never run; run `npm audit` after installing. |
| F2 | Assignment 2, Mini Project | README did not document the frontend build command (`npm run build`, output `dist`). | Low (documentation) | **Fixed in the audited copies** (README only). |
| F3 | All | No `package-lock.json`, so installs are not reproducible. | Low | Not fixed (a lock file can only be created by installing). Documented. |
| F4 | All | Default ports are identical (5000 / 5173); two projects cannot run together unchanged. | Info | Documented in the master README. |
| F5 | All | Real installation, build, database, browser and deployment checks could not be run. | Major limitation | Documented; manual checklists are in each README. |
| F6 | Assignments 1 and the Mini Project | Token in `localStorage`; no login rate limiting. | Accepted design limitation | Documented. |
| F7 | Assignment 2 | No login: public upload/list. | Accepted design limitation (not required by the PDF) | Documented. |

No defects were found in the source code of Assignment 1 or the Mini Project during this audit. (During the build phase one small defect in the Mini Project was already fixed: a failed status change left an unhandled error in the browser console.)

## 5. Cross-project compatibility

- Three independent folders with distinct names; each has its own README, `.gitignore`, `.env.example`, `package.json` files and tests. Combining them in one folder overwrites nothing.
- Shared code is deliberate copying (the login system and some configuration files were copied from Assignment 1 into the Mini Project; `db.js`, `cors.js`, `asyncHandler.js` and Vite files were also copied into Assignment 2). Each copy was compared with the original and is identical; no project imports from another.
- Database names in the examples differ (`fullstack_todo_db`, `image_upload_db`, `task_manager_db`), and the browser storage keys of Assignment 1 (`todo_token`) and the Mini Project (`task_manager_token`) differ, so they do not interfere.
- Architectures and dependencies intentionally differ where the requirements differ (Assignment 2 has no login and no React Router).

## 6. Versions included in the combined package

| Folder | Version | Relationship to the first-release ZIP |
|---|---|---|
| `Assignment-1-Full-Stack-To-Do/` | First release | Identical |
| `Assignment-2-Image-Upload/` | **Audited** | 2 files differ: `backend/package.json` (Multer), `README.md` |
| `Mini-Project-Task-Manager/` | **Audited** | 1 file differs: `README.md` |

## 7. Fingerprints (SHA-256)

Original files: compared with the values recorded earlier in this session; **all six match, so none was changed.**

| File | SHA-256 | Match |
|---|---|---|
| Skill-Nexis-Week-3-Assignment-1-Full-Stack-To-Do.zip | 694ad0aaa8105900754207fa235279f09a9e73ad02e5e86c31f04f5cd7c6da92 | yes |
| Skill-Nexis-Week-3-Assignment-2-Image-Upload.zip (first release) | 06f4ef68809bc1ad993c251b017a7835def5e9bbf8a38e4906a15f8292ec01a1 | yes |
| Skill-Nexis-Week-3-Mini-Project-Task-Manager.zip (first release) | 1402d2ceec555f211585931785603fd3caec01cffcfb359bae6018011bce6ebd | yes |
| Skill-Nexis-Week-2-Assignment-1-To-Do-REST-API.zip | 28cbc99cb5ad0daf1049820d1ddf5c9d278d5ad216dc5b86f7a9204c90c0f368 | yes |
| Skill-Nexis-Week-2-Assignment-2-User-Authentication-API.zip | 65c766c8a5203af06cf4eae7b0cc58ffb7a7187ad225fe0a11a58efdb4c8495f | yes |
| week_3.zip | 0e8a99669d7f53ed640a2e8a52f79fa0c768ef7622d778b651d8ff972ae8ea3f | yes |

New files created by this audit (new names, so no earlier file was replaced):

| File | SHA-256 |
|---|---|
| Skill-Nexis-Week-3-Assignment-2-Image-Upload-Audited.zip | 1443e82f9db79397297e48a707088ee0f4003dd41fc6361730edeabf7bd60b95 |
| Skill-Nexis-Week-3-Mini-Project-Task-Manager-Audited.zip | 6390fb27bdec93c581141746d282996a2bd973cb4913b29f68b6aac5bfeb6e08 |
| Skill-Nexis-Week-3-All-Projects.zip | (shown in the final chat report; a file cannot contain its own fingerprint) |

## 8. Still to be verified (in this order, when internet is available)

1. In each project: `npm install` in `backend/` and `frontend/`; note any error (especially `bcrypt` and `multer`); run `npm audit`.
2. `npm run build` in each `frontend/`.
3. Connect to a real MongoDB database and run each project's manual checklist in a browser (login, CRUD, upload and display, filtering, two-user isolation).
4. Only after that: deployment, one project at a time.
