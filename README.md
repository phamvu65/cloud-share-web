# FileStation

A file sharing web app built with React + Vite. Upload, organize and share files with secure links, preview them in the browser, and run a set of free PDF tools — compress, split, merge, translate, and convert to/from PDF — without needing an account (only downloading a finished result requires signing in).

## Features

- **Auth** — email/username + password, or Google Sign-In, via a custom JWT backend.
- **File management** — upload, preview (images, PDF, video, audio), download, and drag-to-select bulk delete in My Files.
- **Public sharing** — mark a file public and share a link; visitors can view/download it without an account.
- **PDF Tools** — compress, split, merge PDFs, and translate Word documents across 13 languages (with auto-detect).
- **File Converter** — convert PDF to Word/PNG/JPG/HTML and convert Word/PNG/JPG/PowerPoint/Excel/HTML to PDF.
- **Anonymous-friendly tools** — every PDF/converter tool runs without logging in; sign-in is only required to download the finished result, and works from the landing page, the dedicated tool pages, or directly from a shared public file.
- **Credits & billing** — subscription plans and transaction history for account storage/uploads.
- **i18n** — English/Vietnamese UI via a lightweight custom translation layer.

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router v7](https://reactrouter.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Axios](https://axios-http.com/) for API calls
- [pdf-lib](https://pdf-lib.js.org/) + [JSZip](https://stuk.github.io/jszip/) for client-side PDF merge/split
- [lucide-react](https://lucide.dev/) icons, [react-hot-toast](https://react-hot-toast.com/) notifications

## Getting started

### Prerequisites

- Node.js 18+
- A running instance of the backend API (see `VITE_API_URL` below)

### Install

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the project root:

```bash
VITE_API_URL=http://localhost:8080/api/v1.0
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

- `VITE_API_URL` — base URL of the backend API. Defaults to `http://localhost:8080/api/v1.0` if unset.
- `VITE_GOOGLE_CLIENT_ID` — OAuth client ID for "Continue with Google". Google Sign-In is disabled if unset.

### Run the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Available scripts

| Command           | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the Vite dev server with HMR   |
| `npm run build`     | Type-check-free production build to `dist/` |
| `npm run preview`   | Preview the production build locally |
| `npm run lint`      | Run ESLint over the project          |

## Project structure

```
src/
  assets/          Static assets and non-text page data (icons, images)
  components/      Shared UI components (auth modal, file preview, PDF tool widgets...)
  context/         React contexts (auth, credits, language)
  hooks/           Shared hooks (file upload, file preview, async PDF jobs)
  i18n/            Translation strings (en/vi)
  layout/          Page layout wrappers (dashboard, PDF tool pages)
  pages/           Route-level pages, including pages/tools/ for PDF Tools & File Converter
  util/            API endpoint map and small utility helpers
```
