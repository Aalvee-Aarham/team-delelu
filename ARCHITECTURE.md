# Architecture

## Folder Structure
```
team-delelu/
├── backend/
│   ├── src/
│   │   ├── config/env.ts
│   │   ├── middleware/ (error.ts, auth.ts)
│   │   ├── models/ (user, schedule, room, booking, event, announcement, assignment)
│   │   ├── routes/ (auth, schedules, rooms, bookings, events, announcements, assignments, agent, stream)
│   │   ├── seed/index.ts
│   │   ├── agent/ (tools.schema.ts, tools.executor.ts, provider.chain.ts, provider.groq.ts, provider.gemini.ts)
│   │   ├── realtime/sse.ts
│   │   └── server.ts
│   ├── .env / .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/axios.ts, lib/queryClient.ts
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/ (Login, Register, Dashboard, Schedules, Rooms, Events, Announcements, Assignments, Chat)
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
| assignments | id (unique), course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks | deadline |

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
