# CampusOS

An intelligent university platform: a full campus data manager plus an AI agent that reads and acts on live data through real function calling.

## Project Overview

CampusOS has two halves that share one source of truth. The **dashboard** manages all five campus systems — schedules, rooms, events, announcements and assignments — with full add / edit / delete on every one. Changes are written to MongoDB and pushed to every open tab over Server-Sent Events, so the interface updates without a refresh and survives a reload.

The **AI agent** answers questions and takes actions over that same database using genuine tool calling: 16 typed tools that query and mutate MongoDB directly. It never answers from a cached copy of the seed data. It reads announcements alongside the timetable (so a rescheduled class is reported correctly), refuses actions the signed-in user is not authorised to perform, and asks for clarification instead of guessing when a request is vague.

Two details worth trying. **Live Truth:** every answer records which records it was derived from, so if you edit one of those records in another tab, the answer already on screen strikes itself through and offers to re-resolve — you can watch a reply go stale in real time. **Glass-box trace:** every reply expands to show the actual tool calls, their arguments, rows returned, latency, and which provider and key served the turn, including a visible marker when the LLM chain fails over.

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Node 20, Express 4, TypeScript |
| Database | MongoDB (Mongoose 8) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs`, role-based |
| Frontend | React 19, Vite, TypeScript, TanStack Query, Tailwind 4, shadcn/ui |
| Realtime | Server-Sent Events |
| LLM | Groq `openai/gpt-oss-120b` (primary) → Google `gemini-3.8-flash` (fallback) |

## Prerequisites

- Node 20 or newer
- A MongoDB connection string (Atlas or local). If using Atlas, add your IP under **Network Access** or the backend cannot connect.
- A Groq API key and/or a Gemini API key

## Setup

```bash
npm install                                # root
npm install --prefix backend
npm install --prefix frontend

cp backend/.env.example backend/.env       # then fill in real values

npm run dev                                # starts backend :4000 and frontend :5173
```

Open http://localhost:5173. The database seeds itself from `data/*.json` on first start, and two demo accounts are created:

| Role | Email | Password |
|---|---|---|
| Student | `student@campusos.edu` | `campus123` |
| Admin | `admin@campusos.edu` | `campus123` |

Sign in as **admin** to add, edit or delete records; sign in as **student** to see the agent correctly refuse those same actions.

## Environment Variables

All are validated by a zod schema at startup — the server exits naming any missing variable. See `backend/.env.example`.

| Variable | Purpose |
|---|---|
| `PORT` | Backend port (4000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `FRONTEND_URL` | Allowed CORS origin (http://localhost:5173) |
| `GROQ_API_KEY_1`, `GROQ_API_KEY_2` | Groq keys, tried first and second |
| `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2` | Gemini keys, used if both Groq keys fail |
| `LLM_TIMEOUT_MS` | Per-provider timeout before failing over (default 12000) |

No real keys are committed. `backend/.env` is gitignored.

## Using the Agent

Open **AI Agent** in the sidebar. It knows who you are, so "my" resolves to your section and student ID. Things worth asking:

- *When is my next class?*
- *What assignments do I have due this week?*
- *Show me all high priority announcements.*
- *I'm free until 2 PM — is there anything on campus I could drop into?*
- *Which labs have a projector and can fit at least 30 people?*
- *Book Room 7A02 tomorrow from 3 PM to 5 PM.* — it verifies the room is genuinely free first, counting both existing bookings and timetabled classes, and explains the clash if not
- *Register me for the Guest Lecture on Deep Learning.*
- *Just book me any room tomorrow afternoon.* — deliberately vague; it asks which time and room rather than booking anything
- *Cancel tomorrow's CSE 4113 class.* — as a student this is refused; sign in as admin and it works

To see live data in action: ask where a class is, then edit that announcement or class in another tab, and watch the answer on screen mark itself stale.
