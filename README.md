# Cold Emailer

A simple cold-email application consisting of a Backend (Express, Nodemailer) and a Frontend (React + Vite).

This repository contains two folders:
- `Backend` — Express server that serves templates and sends emails using Nodemailer.
- `Frontend` — React app (Vite) for the UI.

## Contents

- Backend: `Backend/`
  - `server.js` — main server file (listens on port 5000)
  - `routes/email.routes.js` — `/api/email` routes:
    - `GET /api/email/templates` — list available templates
    - `POST /api/email/send` — send email (accepts a `resume` file upload, PDF only)
  - `controller/email.controller.js` — template rendering and email sending logic
  - `utils/mailer.js` — Nodemailer transporter (uses Gmail service)
  - `templates/` — EJS and JSON template files (example: `job-application.ejs`, `job-application.json`)

- Frontend: `Frontend/` — React + Vite app for interacting with the backend.

## Prerequisites

- Node.js (v16+ recommended)
- npm (comes with Node.js)
- A Gmail account (or SMTP credentials) for sending emails from the backend

## Environment variables (Backend)

Create a `.env` file in the `Backend/` folder with the following variables:

```
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_email_app_password_or_smtp_password
```

Note: If you use Gmail, consider creating an App Password (preferred) or enabling "Less secure app access" (not recommended).

## Install and run

Backend

1. Open a terminal in `Backend/` and install dependencies:

```powershell
cd "d:/Cold Emailer/Backend"; npm install
```

2. Start the server (production):

```powershell
npm start
```

Or start in development mode (auto-restart using node's --watch):

```powershell
npm run dev
```

The backend serves a static `public/` folder and exposes the API under `http://localhost:5000/api/email`.

Frontend

1. Open a terminal in `Frontend/` and install dependencies:

```powershell
cd "d:/Cold Emailer/Frontend"; npm install
```

2. Start the dev server:

```powershell
npm run dev
```

By default Vite runs on `http://localhost:5173` (or a different port if 5173 is in use).

To build a production bundle:

```powershell
npm run build
```

## API reference

GET /api/email/templates
- Response: JSON list of available templates (name, description, variables, subject)

POST /api/email/send
- Content type: multipart/form-data
- Fields (all required):
  - `name` — sender/applicant name
  - `email` — recipient or applicant email (used as `to` in mail by default)
  - `recipientName` — name of the person receiving the email
  - `role` — role being applied for
  - `company` — company name
  - `experience` — experience summary
  - `skills` — skills list
  - `phoneNumber` — contact phone number
- File (optional):
  - `resume` — must be a PDF, max 10 MB

Successful response example:

```json
{
  "success": true,
  "message": "Email sent successfully!",
  "messageId": "<nodemailer-message-id>"
}
```

Error responses return a JSON object with `success: false` and an `error` message.

## Templates

Templates live in `Backend/templates/`. Each template has a `.json` config and a `.ejs` file with the same base name. The `GET /api/email/templates` endpoint reads the JSON files and returns template metadata.

If you add a new template, include a JSON file describing `name`, `description`, `variables`, and `subject`, plus a corresponding EJS file used to render the HTML body.

## Notes & Troubleshooting

- If emails don't send when using Gmail, verify credentials and consider using an App Password. Check `Backend/` server logs for Nodemailer errors.
- Multer limits uploads to 10 MB and accepts only PDF files. The backend returns a 400 error if file is too large or incorrect mimetype.
- The backend uses port 5000. If you change the port, update the frontend API base URL accordingly.

## Development tips

- The backend serves static files from `Backend/public`. You can place a simple index page there for quick manual testing.
- Use a tool like Postman or curl to exercise the API endpoints directly.

## License

This repository is provided under the ISC license (see `Backend/package.json`).

---

If you'd like, I can also:
- Add example curl and Postman collection for the API.
- Wire the frontend to talk to the backend if it's not already configured.

