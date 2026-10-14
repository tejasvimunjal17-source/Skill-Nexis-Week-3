# Assignment 2 - Image Upload Feature

Skill Nexis Full Stack Web Development (MERN) Internship - Week 3.

Choose an image, see a preview, upload it, and see it appear in a gallery of uploaded images.
The React frontend sends the file to an Express backend that uses Multer.

## Official requirement (week_3.pdf)

> Image Upload Feature
> - Create a file upload endpoint using Multer.
> - Integrate with React to preview and display uploaded images.

| Requirement | Where it is implemented |
|---|---|
| Upload endpoint using Multer | `POST /api/images` - `backend/src/middleware/uploadImage.js`, `backend/src/routes/imageRoutes.js` |
| React integration | `frontend/src/api/client.js` sends the file; `frontend/src/components/UploadForm.jsx` |
| Preview | Chosen image is shown before upload (`UploadForm.jsx`) |
| Display uploaded images | Gallery (`ImageGallery.jsx`) shows images from `GET /api/images/:id/file` |

The week plan also lists "form validation and file upload (Multer)" and "Axios / Fetch": both are used.
The PDF does **not** ask for login, a database, React Router or deleting images, so none of those are required here.

## Implementation decisions (not stated in the PDF)

| Decision | Why |
|---|---|
| Images are stored **in MongoDB** (not in a folder on the server) | Free hosting services such as Render erase files saved on the server when it restarts or sleeps. A database keeps them. |
| Multer `memoryStorage` | The file is held in memory so its real type can be checked before anything is saved. |
| Allowed: JPEG, PNG, GIF, WebP, max **2 MB**, one file per upload | Common, safe defaults. SVG is excluded because SVG files can contain scripts. |
| Real file type is checked from the file's first bytes, not only from the name or browser-claimed type | A text or HTML file renamed to `.png` is refused. |
| No login | Not required by the PDF. See "Known limitations". |
| Vite, Axios (for upload progress) and plain React state | Simple, nothing extra needed. |

Other storage options that were considered: saving files in a server folder with Multer `diskStorage`
(simplest, but files can disappear on free hosting) or an external image service such as Cloudinary
(good for production, but needs an extra account and secret keys).

## Technology stack

React 18, Axios, Vite - Node.js, Express 4, Multer, Mongoose 8, cors - MongoDB.

## Folder structure

```
Assignment-2-Image-Upload/
|-- README.md
|-- .gitignore
|-- .env.example          (explains the two .env files)
|-- backend/
|   |-- server.js, package.json, .env.example, .gitignore
|   |-- src/ (app.js, config/, controllers/, middleware/, models/, routes/, utils/)
|   `-- tests/
`-- frontend/
    |-- index.html, package.json, vite.config.js, .env.example, .gitignore
    |-- src/ (main.jsx, App.jsx, api/, components/, utils/, styles.css)
    `-- tests/
```

## Prerequisites

Node.js 18 or newer and a MongoDB database (MongoDB Atlas free tier or local MongoDB).

## Run on your own computer

**Not yet run by the author** - see "Verification status".

1. In `backend/`: `npm install`, copy `.env.example` to `.env`, set `MONGODB_URI`, then `npm start`.
2. In `frontend/` (second terminal): `npm install`, copy `.env.example` to `.env`, then `npm run dev`.
3. Open http://localhost:5173

## Build the frontend for production

In `frontend/`: `npm run build`. This creates the folder `frontend/dist/`, which is what a hosting service serves.
Set `VITE_API_URL` (in `frontend/.env` or in the hosting service's settings) **before** building, because the value is built into the files.
`npm run preview` shows the built files locally. **Not yet run by the author** (installing needs internet).

## Environment variables

| File | Name | Purpose |
|---|---|---|
| backend/.env | `MONGODB_URI` | MongoDB connection string (required). Uploaded images are stored here. |
| backend/.env | `CLIENT_URL` | Frontend address(es) allowed by CORS, comma-separated (default `http://localhost:5173`) |
| backend/.env | `PORT` | Backend port (default 5000; hosting services set it themselves) |
| backend/.env | `NODE_ENV` | `development` or `production` |
| frontend/.env | `VITE_API_URL` | Backend address, read at build time |

If `VITE_API_URL` is missing in a deployed build, the app shows a clear message instead of calling `localhost`.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health message |
| POST | `/api/images` | Upload one image. `multipart/form-data`, file in the field named `image`. Returns `201` and the image details with a `url`. |
| GET | `/api/images` | List the newest 50 images (details only, no picture data) |
| GET | `/api/images/:id/file` | The picture itself (use as an `<img src>`) |

Error responses: `400` no file / wrong field / not a real image / bad id - `404` unknown image -
`413` over 2 MB - `415` wrong file type. All errors look like `{ "success": false, "message": "..." }`.

Example upload from a computer terminal (replace `photo.png`):
`curl -F "image=@photo.png" http://localhost:5000/api/images`

## Limits (must match in two places)

The 2 MB limit and the four allowed types are defined in `backend/src/config/upload.js` (this is the one
that is enforced) and repeated in `frontend/src/utils/validateFile.js` (quick feedback only).

## Verification status (honest report)

Run backend tests with `npm test` inside `backend/`, and frontend tests with `npm test` inside `frontend/`.

| Check | Type | Result |
|---|---|---|
| File-signature detection with real bytes (PNG, JPEG, GIF, WebP; rejects text, HTML, SVG, WAV, empty) - 9 tests | Offline automated | 9/9 pass |
| Upload rules, file filter, file-name cleaning, error-to-message mapping, id check, CORS parsing - 14 tests | Offline automated | 14/14 pass |
| Controller and route wiring with a fake database, fake Multer and fake Express (spoofed file refused, stored type is the detected type, picture data never in list/response, upload middleware runs before the controller, id validated before the database) - 10 tests | Mock test | 10/10 pass |
| Backend total | | 33/33 pass |
| Frontend: file validation, size formatting, address building - 9 tests | Offline automated | 9/9 pass |
| Deliberately broken the code 4 ways (trust claimed type, skip byte check, drop id check, raise size limit) | Mutation check during preparation | each caught by a failing test |
| React components rendered to HTML with real React: upload form, gallery, empty/error states, escaped file names, deployed vs development API address - 7 checks | Render smoke test during preparation (not included in the ZIP) | 7/7 pass |
| Syntax check and bundle check of all code | Static | pass |

**Not verified yet:** `npm install`, the real Multer library parsing a real upload, a real MongoDB connection,
the production build with real Vite, a real upload and display in a browser, CORS in a browser, and any deployment.
The environment used to prepare this project had no internet access, and the mock tests check this project's own
logic, not the real libraries or database. **An image upload is not claimed to work until it has been tried in a browser.**

## Manual test checklist (after the app is running)

- [ ] Open the page: "No images yet" is shown
- [ ] Choose a JPEG/PNG: a preview appears and the Upload button becomes active
- [ ] Upload: progress shows, a success message appears, the image appears in the gallery
- [ ] Refresh the page: the image is still there (it came back from the database)
- [ ] Choose a PDF or text file: an error message appears and nothing is uploaded
- [ ] Choose an image larger than 2 MB: an error message appears
- [ ] Stop the backend and try to upload: a clear "cannot reach the server" message appears

## Known limitations

- **No login: anyone who can reach the backend can upload images and see all images.** Fine for this assignment, but a public
  deployment could be filled with unwanted files. There is no rate limiting and no delete button.
- Images live in the database. The free Atlas tier has limited storage (512 MB), so the 2 MB limit and the list limit of 50 matter.
- The gallery shows only the newest 50 images.
- Not deployed; no live URL.
- Only JPEG, PNG, GIF and WebP are accepted (no SVG, no HEIC).
- **Multer version:** `package.json` asks for Multer 2.x, because Multer 1.x is deprecated and has known denial-of-service
  vulnerabilities. The real Multer 2.x has never been run here (the tests replace it with a fake), and Multer's own documentation
  describes extra limits for 2.x that are not configured. After installing, run `npm audit` in `backend/` and read its report.
- No `package-lock.json` is included (it can only be created by installing), so installs use the newest versions allowed by `package.json`.

## Audit changes (compared with the first release, `Skill-Nexis-Week-3-Assignment-2-Image-Upload.zip`)

- `backend/package.json`: Multer changed from `^1.4.5-lts.1` to `^2.3.0` (security: 1.x is deprecated with known vulnerabilities).
- `README.md`: added the "Build the frontend for production" section and the Multer / lock-file limitations.
- No source code was changed. The 33 backend and 9 frontend tests were re-run on this copy (results in `AUDIT-REPORT.md` of the combined package).
