# CampusOS — Implementation Plan

## 1. Stack

| Layer | Choice |
|---|---|
| Backend | Node 20 + Express 4 + TypeScript 5 |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | jsonwebtoken 9 + bcryptjs 2, `Authorization: Bearer <jwt>` |
| Validation | zod 3 (env at startup + every request body) |
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| Server state | @tanstack/react-query 5 |
| HTTP | axios 1 (shared instance) |
| UI | Tailwind 3 + shadcn/ui (added only via `npx shadcn@latest add`) |
| Realtime | Server-Sent Events (native `EventSource`, no extra dep) |
| LLM | Groq primary, Gemini fallback (see §6) |

Ports: backend **4000**, frontend **5173**. Never changed.

---

## 2. Features

**Part 1 — Campus Data Manager**
- Five sections, each with full view / add / edit / delete: Schedules, Rooms, Events, Announcements, Assignments.
- Seed loads the five JSON files into MongoDB on first startup when a collection is empty.
- Every mutation writes to MongoDB and is reflected in the UI with no manual refresh (react-query cache invalidation + SSE broadcast).
- Extra actions: rooms **book** / **cancel booking**; events **register** / **cancel registration**.
- Search + filter per section; priority/status badges; confirm dialog on delete.

**Part 2 — AI Agent**
- Real function calling against live MongoDB — never a cached or hardcoded copy of the seed.
- Answers lookups, stitches multi-source answers, takes actions, asks when vague, refuses when unauthorized.
- Refusal is enforced **server-side in the tool executor** from the JWT role, not by prompt instruction alone, so it cannot be talked around.

**Auth & roles**
- Register + login. User: `student_id`, `name`, `email`, `section`, `role`.
- `student` — may book rooms, register self for events, cancel only their own bookings/registrations.
- `admin` — may additionally add/edit/delete schedules, rooms, events, announcements, assignments.
- Seeded demo accounts: `student@campusos.edu` / `admin@campusos.edu`, password `campus123`.

---

## 3. Pages

| Route | Page | Notes |
|---|---|---|
| `/login` | Login | Demo-account quick-fill buttons |
| `/register` | Register | student_id + section captured |
| `/` | Dashboard | Counts, next class, due-this-week, high-priority notices, live-change feed |
| `/schedules` | Schedules | Table, day filter, CRUD |
| `/rooms` | Rooms | Cards, equipment/capacity filter, availability checker, book/cancel |
| `/events` | Events | Cards, register/cancel, capacity meter |
| `/announcements` | Announcements | Priority-sorted board, expiry state, CRUD |
| `/assignments` | Assignments | Deadline-sorted, status control, CRUD |
| `/chat` | AI Agent | Chat + tool-call inspector + live-truth banner |

Admin-only controls are hidden for students and rejected server-side regardless.

---

## 4. Data Model

`users` — `_id`, `student_id` (unique), `name`, `email` (unique), `passwordHash`, `section`, `role`, `createdAt`
`schedules` — `id` (unique), `course`, `title`, `day`, `start_time`, `end_time`, `room`, `instructor`, `section`
`rooms` — `id` (unique), `room_number` (unique), `type`, `capacity`, `equipment[]`, `floor`, `status`
`bookings` — `booking_id` (unique), `room_number`, `booked_by`, `booked_by_name`, `date`, `start_time`, `end_time`, `purpose`
`events` — `id` (unique), `name`, `description`, `date`, `start_time`, `end_time`, `end_date`, `venue`, `organizer`, `capacity`, `registered`, `registrations[]`, `status`
`announcements` — `id` (unique), `title`, `body`, `date`, `priority`, `posted_by`, `expires`
`assignments` — `id` (unique), `course`, `course_title`, `title`, `description`, `assigned_date`, `deadline`, `submission_platform`, `status`, `marks`

Bookings are stored in their own collection but **every rooms response re-embeds them as `bookings[]`**, so the wire format matches `schema/schema.md` exactly.

Indexes: `bookings{room_number, date}`, `schedules{day, section}`, `assignments{deadline}`, `announcements{priority, expires}`, `events{date}`, unique on every `id`.

---

## 5. API Routes

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/health` | — | `{ status:"ok", timestamp }` |
| POST | `/api/auth/register` | `{name,email,password,student_id,section}` | `{token,user}` |
| POST | `/api/auth/login` | `{email,password}` | `{token,user}` |
| GET | `/api/auth/me` | — | `{user}` |
| GET | `/api/schedules` | `?day&course&section` | `Schedule[]` |
| POST | `/api/schedules` | `Schedule` (admin) | `Schedule` |
| PATCH | `/api/schedules/:id` | `Partial<Schedule>` (admin) | `Schedule` |
| DELETE | `/api/schedules/:id` | — (admin) | `{deleted:true}` |
| GET | `/api/rooms` | `?type&min_capacity&equipment` | `Room[]` (bookings embedded) |
| POST/PATCH/DELETE | `/api/rooms(/:id)` | admin | `Room` |
| GET | `/api/rooms/availability` | `?date&start_time&end_time&min_capacity&equipment` | `{available:Room[], conflicts:[]}` |
| POST | `/api/rooms/:room_number/book` | `{date,start_time,end_time,purpose}` | `Booking` |
| DELETE | `/api/bookings/:booking_id` | — (own, or admin) | `{deleted:true}` |
| GET | `/api/events` | `?status&date` | `Event[]` |
| POST/PATCH/DELETE | `/api/events(/:id)` | admin | `Event` |
| POST | `/api/events/:id/register` | — | `Event` |
| DELETE | `/api/events/:id/register` | — | `Event` |
| GET | `/api/announcements` | `?priority&active` | `Announcement[]` |
| POST/PATCH/DELETE | `/api/announcements(/:id)` | admin | `Announcement` |
| GET | `/api/assignments` | `?status&course&due_before` | `Assignment[]` |
| POST/PATCH/DELETE | `/api/assignments(/:id)` | admin | `Assignment` |
| GET | `/api/me/bookings` | — | `Booking[]` |
| GET | `/api/me/registrations` | — | `Event[]` |
| POST | `/api/agent/chat` | `{messages[]}` | `{reply, toolCalls[], provider, model, latencyMs}` |
| GET | `/api/agent/health` | — | `{chain:[{provider,model,ok}]}` |
| GET | `/api/stream` | SSE | `{type:"change", collection, action, id, at}` |

All non-auth routes require a valid Bearer token. Errors flow through one Express error middleware; no per-route try/catch.

---

## 6. LLM Fallback Chain

Verified live against the supplied keys on 2026-09-04:

| Order | Provider | Model | Check |
|---|---|---|---|
| 1 | Groq key 1 | `openai/gpt-oss-120b` | HTTP 200; `supported_features` contains `tools` |
| 2 | Groq key 2 | `openai/gpt-oss-120b` | HTTP 200 |
| 3 | Gemini key 1 | `gemini-3.8-flash` | HTTP 200; model present for this key |
| 4 | Gemini key 2 | `gemini-3.8-flash` | HTTP 200 |

Groq is reached through its OpenAI-compatible `/openai/v1/chat/completions`, so links 1–2 share one client. Gemini uses `generateContent` with `x-goog-api-key`; tool schemas are translated from OpenAI shape to Gemini `functionDeclarations` once, in an adapter.

Advance to the next link on: HTTP 429/5xx, network error, or **latency exceeding `LLM_TIMEOUT_MS` (default 12000)**. An `AbortController` cancels the slow attempt so a stalled provider cannot hold the request. The full tool-call loop (up to 6 rounds) is preserved across a switch — the conversation and any tool results already gathered are replayed to the new provider. If all four links fail the user gets a plain error, never a fabricated answer.

`groq/compound` was rejected: its `supported_features` lists only `json_mode`, not `tools`.

---

## 7. Open Questions

All resolved before implementation. None remain open.

1. **How does "me" resolve?** → Full JWT auth with a User model; `my schedule` filters by the logged-in user's `section`, `register me` writes their real `student_id`. *(confirmed)*
2. **What gives the agent something real to refuse?** → student/admin roles, enforced in the tool executor from the JWT. *(confirmed)*
3. **Booking storage, and do classes block bookings?** → separate `bookings` collection, embedded on read; availability considers both bookings **and** the class timetable. *(confirmed)*
4. **Which LLM leads?** → Groq primary, Gemini fallback. *(confirmed)*
5. **Which model IDs are current for Sept 2026?** → resolved by querying both providers directly; see §6. *(resolved by verification, not assumption)*
6. **Real clock or pinned demo time?** → real system clock. `DEMO_NOW` is an *optional* env override, unset by default, so the app still demos correctly if run after the seed dates pass. `.env` stays exactly as specified.
7. **Do the LLM keys belong in `.env`?** → yes; the four keys are added to `backend/.env` alongside the specified block, and to `.env.example` as placeholders only. `.env` is gitignored before the first commit.

---

## 8. Wow Factor

### PRIMARY — Live Truth: answers that visibly invalidate themselves

The brief states outright: *"We will also edit data through the dashboard mid-evaluation and immediately ask the agent about the change."* The ordinary build passes this by re-querying on the next message. This makes the judge *see* it happen.

Every agent reply records the exact records it was derived from (`collection` + `id` + a content hash) in a provenance set. The backend broadcasts every mutation over SSE. When a change lands that touches any record a visible answer depended on, that answer card — already on screen, mid-conversation — dims, strikes through the stale sentence, and shows **"This changed while you were reading."** with a one-tap **Refresh answer** that re-runs the same question against live data and diffs the two replies inline.

So a judge edits `ann-001` in another tab and, without touching the chat, watches the agent's earlier "CSE 4113 is in 7A07 at 1:00 PM" strike itself out and re-resolve to the new room and time. It converts the 10 "always uses latest data" marks from a claim into a demonstration, and it is only possible *because* provenance is tracked per tool call — which is exactly the architecture the rules demand anyway.

### SECONDARY — Glass-box tool inspector

The rules require real function calling and warn that prompt chaining does not count, but a judge normally has to take that on trust. Every reply carries a collapsible trace: each tool invoked, its arguments, the row count returned, per-call latency, and which provider/key/model served the turn — including a visible marker the moment the chain fails over from Groq to Gemini. Proves the requirement instead of asserting it, and doubles as the debug surface during the build.

### THIRD — Clarification chips

For genuinely under-specified requests (*"just book me any room tomorrow afternoon"*), the agent does not free-text an interrogation. It returns a structured clarification with tappable chips for the missing dimensions only — time window, capacity, equipment — each chip pre-filtered to options that are *actually free* at that moment. Refusing to guess becomes a two-tap path to done.

**Build order:** PRIMARY is mandatory and is built. SECONDARY is built (it is cheap and shares the provenance plumbing). THIRD is built if the core rubric items are green with time remaining.

---

## 9. Risk Note

The submission deadline in `SUBMISSION.md` is **8:30 PM, 4 September** — today. Task order in `TASKS.md` is therefore strictly rubric-first: data + CRUD + persistence (40 marks) before the agent (40), agent before polish (20), PRIMARY wow factor after the agent core is green. Every task is independently shippable, so the build is submittable at any stopping point.

---

## 10. Post-Submission — Agentic Capability Expansion

Scope requested after the hackathon deadline, on branch `ai-agent-improvement`. Extends the already-shipped agent (T21–T25, T36–T38) rather than replacing it. Grouped into three tiers by how much they build on existing plumbing vs. require new surface area.

**Tier A — extends the existing tool executor + trace (low new surface)**
- Admin write tools: `create_schedule`/`create_room`/`create_event`/`create_announcement`/`create_assignment`, `update_*`, `delete_*` — thin wrappers over the CRUD services already used by the REST routes, gated by the same `requireAdmin` check the executor already enforces for `delete_announcement` (T22).
- Bulk variant tools: `bulk_update_schedules` (e.g. reschedule every class taught by an instructor), `bulk_expire_announcements` — same services, looped, one provenance entry per affected record, one SSE broadcast per record so Live Truth (T38) still tracks them individually.
- Pre-execution conflict check: before any `book_room`/`create_schedule`/`create_event` write, the executor re-runs the same overlap/capacity check `POST /api/rooms/:room_number/book` already does (T17) and returns a structured `conflict` result instead of writing, so the model can relay it and ask to confirm or revise — this is a tightened version of runner.ts RULE 5, not new logic.
- Missing-field intake: no schema change needed — RULE 3 in `buildSystemPrompt` (runner.ts:65) already tells the model to ask instead of guess; this tier just adds admin-shaped examples (capacity, equipment, department) to that rule text.

**Tier B — new read tools + frontend surface**
- `find_common_free_slot(student_ids[])` tool: cross-reference `get_schedule` for each id, return overlapping free windows, then reuse the existing room-availability tool to suggest a bookable room.
- Announcement urgency triage: no new tool — a `priority: "high"` filter already exists (`GET /api/announcements?priority=high`); add a dashboard/chat surface that puts those first, computed client-side from data the agent/dashboard already fetches.
- Analytics tool(s) exposing pre-aggregated JSON (room utilization %, assignment status counts, event capacity-vs-registered, bookings-by-hour) computed server-side from existing collections — no new collection, no raw dump to the model (keeps Groq's 8000 TPM ceiling intact, per the CHANGES.md T-lean-projection fix).
- Chat-embedded charts rendering those aggregates (pie: utilization / assignment status / event capacity; bar: peak booking hours, weekly class load; timeline: deadline map) — **needs the `dataviz` skill loaded before any chart code is written**, and a charting library added to `.claude/rules/dependencies.md` before install (none is present today).
- Preset suggestion chips ("Generate Campus Analytics", "Analyze Room Utilization") in ChatPage — same chip mechanism already stubbed for T39 clarification chips.

**Tier C — new interaction model (largest surface, touches many files)**
- Rich in-chat widgets: confirmation cards, date/time pickers, selectable room chips rendered from structured tool results instead of prose — extends `ToolTrace.tsx`/ChatPage rendering, shadcn `Popover`/`Command` added via the CLI per convention.
- Agent state indicator: ambient status (reading / calling a tool / committed) driven off the same per-round trace data runner.ts already returns, surfaced as a small animated badge in ChatPage.
- Optimistic UI + undo: CRUD pages apply the mutation to the react-query cache immediately, show a toast with an Undo action that calls the inverse endpoint (`DELETE` for an add, the prior values for an edit) within a short window, then reconciles with the SSE-confirmed state — touches all five CRUD pages plus the shared `FormDialog`/`ConfirmDelete` primitives.

### Wow Factor — Post-Submission

**PRIMARY (new) — Conflict-aware confirmation, not just refusal.** The shipped agent already refuses cleanly (T22) and asks when vague (RULE 3). What it does not yet do is show its work before a write: "7A02 is free 3–5 PM, capacity 40, has a projector — book it?" with the actual competing booking named when it is not free. This is the direct rubric ask ("Pre-Execution Conflict Checking... alerting the user to conflicts before asking to confirm or revise") and reuses 100% of existing provenance/executor plumbing — highest leverage per file touched.

**SECONDARY (new) — Live analytics inside the chat**, sharing the provenance/SSE wiring from T38 so a chart itself can go stale and refresh, the same way a text answer already does.

### Open Questions — resolved

1. **Which tiers to build now?** → Tier A + Tier B. Tier C (rich widgets, agent state indicator, optimistic UI/undo) deferred, not scheduled.
2. **Charting library?** → `recharts`, added to `.claude/rules/dependencies.md`.
3. **Bulk operations — confirmation flow?** → preview-then-confirm: first call returns affected count/ids with no write, a second explicit confirm message performs it. Already how T45 is scoped.

---

## 11. Post-Submission — Voice Feature (AWS Polly + Transcribe)

Scope: add spoken interaction to the chat page — the user can speak a question instead of typing, and hear the agent's reply spoken back. Two independent AWS services, both behind new backend routes so the AWS SDK and credentials never reach the browser.

**Backend**
- `voice.service.ts`: `synthesizeSpeech(text)` calls Amazon Polly `SynthesizeSpeechCommand` (mp3 output, a single default voice) and returns the audio buffer; `transcribeAudio(buffer, mimeType)` feeds the recorded clip through `@aws-sdk/client-transcribe-streaming`'s `TranscribeStreamingClient` as a single async-iterable chunk and collects the final transcript — no S3 bucket, no batch-job polling, so the round trip stays request/response like every other route here.
- `POST /api/voice/speak` — `{ text }` → `audio/mpeg` stream. `POST /api/voice/transcribe` — a recorded audio blob (multipart or raw body) → `{ text }`. Both behind `requireAuth`, same as every other route.
- New env vars `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (default `us-east-1`), validated in `env.ts` the same way the LLM keys are, added to `.env.example` as placeholders only. **The real key pasted in chat is written straight to `backend/.env` (gitignored) and never repeated in any commit, log, or reply.**

**Frontend**
- A mic button next to the chat input using the browser `MediaRecorder` API to record a short clip, POST it to `/api/voice/transcribe`, and drop the returned text into the input (or send it directly, mirroring how a starter chip works).
- A speaker button on each agent reply bubble that calls `/api/voice/speak` and plays the returned mp3 via an `<audio>` element — reuses the existing message-bubble structure in `ChatPage.tsx`, no new page.

### Open Questions — resolved

1. **Direction?** → both: speech-to-text for the user's question, text-to-speech for the agent's reply. *(confirmed)*
2. **AWS region?** → `us-east-1` default, overridable via `AWS_REGION` env var — no region was specified with the key, and this is a reasonable default with full Polly/Transcribe coverage.
3. **Realtime streaming transcription vs. record-then-send?** → record-then-send (one clip per question). True streaming transcription (live partial results while speaking) needs a persistent WebSocket from the browser and is a materially bigger frontend change for a hackathon-scale voice feature; record-then-send reuses the existing request/response route pattern everywhere else in this backend.
4. **Which Polly voice?** → a single sensible default (e.g. `Joanna`, neural engine) with no user-facing voice picker in this pass — can be added later as a query param without touching the route contract.
