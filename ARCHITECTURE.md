# Architecture

## Folder Structure
```
team-delelu/
├── backend/
│   ├── src/
│   │   ├── config/env.ts
│   │   ├── middleware/ (error.ts, auth.ts)
│   │   ├── models/ (user, schedule, room, booking, event, announcement, assignment, course, submission, comment)
│   │   ├── routes/ (auth, schedules, rooms, bookings, events, announcements, assignments, courses, submissions, comments, uploads, agent, stream)
│   │   ├── services/ (rooms, cloudinary, uploadthing, upload.types)
│   │   ├── seed/ (index.ts, backfill.ts)
│   │   ├── agent/ (tools.schema.ts, tools.executor.ts, provider.chain.ts, provider.groq.ts, provider.gemini.ts)
│   │   ├── realtime/sse.ts
│   │   └── server.ts
│   ├── .env / .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/axios.ts, lib/queryClient.ts
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/ (Login, Register, Dashboard, Schedules, Rooms, Events, Announcements, Assignments, AssignmentDetail, Courses, CourseDetail, Submissions, Chat)
│   │   ├── components/ (DataTable, FormDialog, ConfirmDelete, ui/*)
│   │   ├── hooks/ (use*.ts per resource)
│   │   └── App.tsx, main.tsx
│   └── package.json
├── data/ (seed JSON, read-only)
└── package.json (root: concurrently dev/build/tsc)
```

## Data Model (MongoDB / Mongoose)

| Collection | Fields | Indexes |
|---|---|---|
| users | student_id (unique), name, email (unique), passwordHash, section, role, createdAt | email, student_id |
| schedules | id (unique), course, title, day, start_time, end_time, room, instructor, section | day+section |
| rooms | id (unique), room_number (unique), type, capacity, equipment[], floor, status | room_number |
| bookings | booking_id (unique), room_number, booked_by (userId), booked_by_name, date, start_time, end_time, purpose | room_number+date |
| events | id (unique), name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, registrations[], status | date |
| announcements | id (unique), title, body, date, priority, posted_by, expires | priority, expires |
| assignments | id (unique), course_id, course, course_title, title, description, attachments[], assigned_date, deadline, submission_platform, status, marks, accepts_text, accepts_files | deadline, course_id |
| courses | id (unique), code, title, description, section, instructor, room, term, cover_url, cover_credit, accent, enrolled[], archived, created_at | code |
| submissions | id (unique), assignment_id, assignment_title, course_id, course_code, student_id, student_name, text, attachments[], submitted_at, late, status, grade, feedback, reviewed_by, reviewed_at | assignment_id+student_id (unique), course_id+status |
| comments | id (unique), target_type, target_id, course_id, parent_id, author_id, author_name, author_role, body, created_at | target_type+target_id+created_at |

`courses` is the Google-Classroom-style container: assignments and announcements carry a
`course_id`, so a course page can render its own stream, classwork, submissions and roster.
Announcements with an empty `course_id` are campus-wide.

Attachments are stored as `{ url, name, mime, size, provider, kind }`. Student submission files
go to **Cloudinary** (`POST /api/uploads/submissions`) and admin images go to **UploadThing**
(`POST /api/uploads/images`). Either provider falls back to disk under `backend/uploads/`,
served at `/api/uploads/files/<name>`, when its credentials are absent — so the feature works
before the keys are filled in and switches to the CDN the moment they are.

Bookings live in their own collection but are re-embedded as `bookings[]` on every `rooms` API response to match `schema/schema.md`.

## Layer Connections
Frontend (5173) → axios (Bearer JWT) → Express (4000) → Mongoose → MongoDB Atlas.
SSE (`/api/stream`) pushes mutation events to the frontend for zero-refresh updates.
Agent route (`/api/agent/chat`) → provider chain (Groq→Groq→Gemini→Gemini) → tool executor → same Mongoose models as the REST routes (single source of truth).

## Env Vars

| Var | Type | Example |
|---|---|---|
| PORT | number | 4000 |
| NODE_ENV | string | development |
| MONGODB_URI | string | mongodb+srv://... |
| JWT_SECRET | string | change_this_in_production |
| JWT_EXPIRES_IN | string | 7d |
| FRONTEND_URL | string | http://localhost:5173 |
| GROQ_API_KEY_1 | string | gsk_... |
| GROQ_API_KEY_2 | string | gsk_... |
| GEMINI_API_KEY_1 | string | AQ.... |
| GEMINI_API_KEY_2 | string | AQ.... |
| LLM_TIMEOUT_MS | number | 12000 |
| UPLOADTHING_TOKEN | string (optional) | eyJhcGlLZXkiOi... |
| CLOUDINARY_CLOUD_NAME | string (optional) | your_cloud_name |
| CLOUDINARY_API_KEY | string (optional) | 123456789012345 |
| CLOUDINARY_API_SECRET | string (optional) | your_api_secret |
| MAX_UPLOAD_MB | number | 16 |
