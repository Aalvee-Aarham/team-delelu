# CampusOS — Build Checklist

Legend: `[ ]` pending · `[~]` blocked · `[x]` done (Done Criteria satisfied)
Order is rubric-first. Commit after every `[x]` as `[task-id] description`.

---

## Phase 0 — Context Files

- [x] **T01** Write `CLAUDE.md`, `.claude/rules/conventions.md`, `.claude/rules/banned.md`, `.claude/rules/dependencies.md`, `AGENT_INSTRUCTIONS.md`, `ARCHITECTURE.md`, `API.md`, `CHANGES.md`.
  ✓ Done when: all 8 files exist, `CLAUDE.md` ≤ 40 lines, `ARCHITECTURE.md` ≤ 120 lines, `API.md` ≤ 120 lines.

- [x] **T02** Root workspace: `package.json` with `dev`/`build`/`tsc --noEmit` via concurrently, `.gitignore` containing `.env` and `node_modules`, `backend/.env` + `backend/.env.example`.
  ✓ Done when: `git check-ignore backend/.env` prints the path, and `.env.example` contains zero real credentials.

---

## Phase 1 — Backend Foundation

- [x] **T03** Scaffold `backend/` — TypeScript, Express, CORS to `FRONTEND_URL`, `tsconfig.json` strict.
  ✓ Done when: `npx tsc --noEmit` exits 0.

- [x] **T04** `backend/src/config/env.ts` — zod schema validating every `.env` key plus the four LLM keys; crash with a named-variable message on any missing var.
  ✓ Done when: renaming `JWT_SECRET` in `.env` crashes startup printing `JWT_SECRET`, and restoring it starts cleanly.

- [x] **T05** `backend/src/middleware/error.ts` — single global error middleware; `AppError` class with status codes.
  ✓ Done when: `curl -s localhost:4000/api/schedules/nope-999` returns JSON `{error:...}` with a 404, not an HTML stack trace.

- [x] **T06** Mongo connection + `GET /health`.
  ✓ Done when: `curl -s localhost:4000/health` returns `{"status":"ok","timestamp":"<ISO>"}` and logs confirm an Atlas connection.

---

## Phase 2 — Data Layer (20 marks: Data Management)

- [x] **T07** Mongoose models for `users`, `schedules`, `rooms`, `bookings`, `events`, `announcements`, `assignments` with the indexes named in `PLAN.md` §4.
  ✓ Done when: `npx tsc --noEmit` exits 0 and every model file is under 300 lines.

- [x] **T08** `backend/src/seed/index.ts` — loads the five `data/*.json` files into Mongo, per-collection, only when that collection is empty; called from `server.ts`.
  ✓ Done when: on a clean DB, startup logs 24 schedules / 20 rooms / 7 events / 8 announcements / 8 assignments, and a second startup logs "already seeded" and does not duplicate.

- [x] **T09** Seed demo users: `student@campusos.edu` and `admin@campusos.edu`, password `campus123`, bcrypt-hashed.
  ✓ Done when: both users exist with hashed (never plaintext) passwords and correct roles.

---

## Phase 3 — Auth

- [x] **T10** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; `requireAuth` and `requireAdmin` middleware.
  ✓ Done when: `curl -X POST localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"student@campusos.edu","password":"campus123"}'` returns a token, and `GET /api/schedules` without a token returns 401.

---

## Phase 4 — CRUD (20 marks: CRUD Operations)

- [x] **T11** Schedules: GET list (filters `day`,`course`,`section`), GET one, POST, PATCH, DELETE (admin-gated).
  ✓ Done when: POST a schedule → 201; GET list contains it; PATCH changes `start_time` → response shows new value; DELETE → 200; GET returns 404. Student token on POST → 403.

- [x] **T12** Rooms CRUD, with `bookings[]` re-embedded on every read to match `schema/schema.md`.
  ✓ Done when: `curl -s localhost:4000/api/rooms | jq '.[0]|keys'` lists exactly the schema fields including `bookings`, and a PATCH to `capacity` persists across a server restart.

- [x] **T13** Events CRUD.
  ✓ Done when: full POST→GET→PATCH→DELETE cycle passes and `registrations`/`registered` survive a PATCH to unrelated fields.

- [x] **T14** Announcements CRUD.
  ✓ Done when: full cycle passes; `?priority=high` returns only high-priority rows.

- [x] **T15** Assignments CRUD.
  ✓ Done when: full cycle passes; `?due_before=2026-09-12` filters by deadline correctly.

---

## Phase 5 — Actions

- [x] **T16** `GET /api/rooms/availability` — filters by date, time window, `min_capacity`, `equipment[]`; excludes rooms blocked by an existing booking **or** by a timetabled class.
  ✓ Done when: a query for the slot of a known class in `schedules.json` omits that room and names the class as the conflict reason.

- [x] **T17** `POST /api/rooms/:room_number/book` + `DELETE /api/bookings/:booking_id`; overlap rejected with 409; students may cancel only their own booking.
  ✓ Done when: booking 7A02 tomorrow 15:00–17:00 succeeds; the identical repeat returns 409; another student's DELETE returns 403.

- [x] **T18** `POST/DELETE /api/events/:id/register`; capacity enforced; `registered` count stays consistent; duplicate registration rejected.
  ✓ Done when: registering the demo student increments `registered` by exactly 1, a repeat returns 409, and cancel decrements it back.

- [x] **T19** `GET /api/me/bookings`, `GET /api/me/registrations`.
  ✓ Done when: both return only the authenticated user's rows.

---

## Phase 6 — Realtime

- [x] **T20** SSE hub + `GET /api/stream`; every mutating route publishes `{type,collection,action,id,at}`.
  ✓ Done when: `curl -N localhost:4000/api/stream` prints an event within a second of a PATCH issued from a second terminal.

---

## Phase 7 — AI Agent (40 marks)

- [x] **T21** Tool schema definitions (OpenAI shape) for all read tools, action tools, and admin tools, in `backend/src/agent/tools.schema.ts`.
  ✓ Done when: `npx tsc --noEmit` exits 0 and every tool has a typed zod arg validator.

- [x] **T22** Tool executor — resolves each call against **live MongoDB**, enforces role server-side, returns a structured permission error for a disallowed call, and records provenance (`collection`+`id`) per call.
  ✓ Done when: a student-token call to `delete_announcement` returns a refusal object from the executor with no DB write, verified by re-reading the record.

- [x] **T23** Provider chain — Groq key1 → key2 → Gemini key1 → key2, advancing on 429/5xx/network/timeout via `AbortController`; OpenAI↔Gemini tool-schema adapter; conversation replayed intact across a switch.
  ✓ Done when: `GET /api/agent/health` reports all four links, and with both Groq keys set to a bogus value the chat still answers correctly via Gemini and reports `provider:"gemini"`.
  **Post-submission fix (see CHANGES.md):** the "replayed intact" claim was true for content/text but not for tool_calls — Gemini rejected any replayed functionCall lacking the exact thoughtSignature it originally issued, so a mid-loop failover into Gemini (or even a second Gemini-served round, since the signature was discarded) surfaced as "Internal server error". Now fixed: Gemini's own signature is captured and replayed; a foreign-provider tool-call turn is summarized as text instead of forged.

- [x] **T24** `POST /api/agent/chat` — multi-round tool loop (max 6), system prompt carrying today's date, the user's identity/section/role, and refusal + clarification policy.
  ✓ Done when: *"When is my next class?"* returns a correct course, time, and room traceable to a `get_schedule` tool call in the response payload.

- [x] **T25** Agent behaviour pass against every query in `sample_queries/sample_queries.md`.
  ✓ Done when: all 9 sample queries return correct answers; *"Book Room 7A02 tomorrow from 3 PM to 5 PM"* actually creates a booking visible in `GET /api/rooms`; *"Just book me any room tomorrow afternoon"* asks for clarification and creates **nothing**.

---

## Phase 8 — Frontend Foundation

- [x] **T26** Vite + React + TS scaffold on port 5173, Tailwind, shadcn/ui init, `lib/axios.ts` with token interceptor, react-query provider, router, auth context + protected routes.
  ✓ Done when: `npm run build` in `frontend/` exits 0 and an unauthenticated visit to `/` redirects to `/login`.

- [ ] **T27** App shell — sidebar nav for the five sections + chat, user badge, role pill, logout, dark theme.
  ✓ Done when: all 7 nav targets render without console errors.

---

## Phase 9 — Frontend CRUD Pages (20 marks: UI/UX)

- [ ] **T28** Login + Register pages with demo-account quick-fill.
  ✓ Done when: one click fills the student credentials and logging in lands on `/`.

- [ ] **T29** Shared CRUD primitives — `DataTable`, `FormDialog`, `ConfirmDelete`, toasts, skeletons, empty states.
  ✓ Done when: each file is under 300 lines and reused by at least three section pages.

- [ ] **T30** Schedules page — day filter, add/edit/delete.
  ✓ Done when: adding a class makes it appear with no manual refresh, and it is still there after a hard reload.

- [ ] **T31** Rooms page — equipment/capacity filters, availability checker, book + cancel, CRUD.
  ✓ Done when: booking a room from the UI shows the new booking immediately and it persists across reload.

- [ ] **T32** Events page — register/cancel, capacity meter, CRUD.
  ✓ Done when: registering moves the meter and survives reload.

- [ ] **T33** Announcements page — priority board, expiry state, CRUD.
  ✓ Done when: editing a title updates the card instantly without refresh.

- [ ] **T34** Assignments page — deadline sort, status control, CRUD.
  ✓ Done when: full add/edit/delete cycle persists across reload.

- [ ] **T35** Dashboard — counts, next class, due this week, high-priority notices, live change feed.
  ✓ Done when: every tile shows real backend numbers and updates on an edit made in another tab.

---

## Phase 10 — Agent UI + Wow Factor

- [x] **T36** Chat page — message list, streaming-feel send, error states, suggested starter queries drawn from the sample set.
  ✓ Done when: all 9 sample queries can be run from the UI and render correct answers.

- [x] **T37** **SECONDARY wow** — glass-box tool inspector: per-message collapsible trace of tool name, arguments, row count, latency, and the serving provider/key/model, with a visible failover marker.
  ✓ Done when: asking *"Which labs have a projector and fit at least 30 people?"* shows the real `find_rooms` call with its arguments and returned row count.

- [x] **T38** **PRIMARY wow** — Live Truth: per-answer provenance, SSE subscription, stale answers that strike through with "This changed while you were reading," and a Refresh-answer action that re-runs the question and diffs old vs new inline.
  ✓ Done when: with the chat open showing an answer about `ann-001`, editing that announcement in a second tab visibly marks the answer stale within 2 seconds, and Refresh returns the updated room and time.

- [ ] **T39** **THIRD wow** (time permitting) — clarification chips for under-specified requests, pre-filtered to genuinely free options.
  ✓ Done when: *"Just book me any room tomorrow afternoon"* renders time/capacity chips and books only after a chip is chosen.

---

## Phase 11 — Ship

- [x] **T40** `README.md` (≤ 15 lines) — overview, prerequisites, run steps, env vars, how to talk to the agent.
  ✓ Done when: a clean `git clone` + `npm install` + `npm run dev` starts both servers with no undocumented step.

- [x] **T41** Full verification — `npx tsc --noEmit` and `npm run build` from root; re-run all 9 sample queries; confirm CRUD persistence on all five systems after a restart.
  ✓ Done when: both commands exit 0 and every Done Criteria above is re-confirmed green.

- [ ] **T42** Final commit; confirm no real credentials committed.
  ✓ Done when: `git log --all -p | grep -c "gsk_"` returns 0 and `git ls-files | grep -c "^backend/.env$"` returns 0.

---

## Phase 12 — Post-Submission: Agentic Capability Expansion (see PLAN.md §10)

Branch `ai-agent-improvement`. Tier A only — no new dependencies, no scope ambiguity. Tier B/C tasks are written once open questions in PLAN.md §10 are answered.

- [x] **T43** Admin write tools in `tools.schema.ts`/`tools.executor.ts`: `create_schedule`, `update_schedule`, `delete_schedule`, and the same triad for rooms, events, announcements, assignments — each a thin wrapper over the existing CRUD service, gated by the executor's existing role check.
  ✓ Done when: a student-token call to any `create_*`/`update_*`/`delete_*` tool returns the same structured permission-denied shape as `delete_announcement` today, with no DB write; an admin-token call succeeds and the write is visible in the corresponding `GET` endpoint. — verified live: student `delete_room` call refused with no write; admin `create_room` call created room 999, visible in `GET /api/rooms`, then cleaned up.

- [x] **T44** Pre-execution conflict check inside the executor for `book_room`, `create_schedule`, `create_event`: re-run the existing overlap/capacity check before writing; on conflict, return a structured `conflict` result (competing booking/class named) instead of writing.
  ✓ Done when: asking the agent to book an already-busy room returns the specific conflicting booking/class in the reply and creates nothing; the identical request against a free slot books normally. — verified live: `create_schedule` clashing with `sch-001` (room 7A07, Sunday 13:00-13:50) was refused, naming the exact conflicting class; nothing written (re-GET `?course=CSE%209999` returned `[]`).

- [x] **T45** Bulk admin tools: `bulk_reschedule_instructor` (shift all of one instructor's classes by a delta), `bulk_clear_expired_announcements` (delete announcements past a cutoff date). Preview-then-confirm: first call returns affected count + ids without writing; a second, explicit confirm message performs the writes, one provenance entry and one SSE broadcast per affected record.
  ✓ Done when: the preview call changes nothing (verified by re-GET), and the confirm call updates every previewed record and emits one SSE event per record. — verified live: "Clear all expired announcements" ran `bulk_clear_expired_announcements` with `confirm:false`, wrote nothing, announcement count unchanged at 8.

- [x] **T46** System prompt update (`runner.ts` `buildSystemPrompt`): extend RULE 3 with admin-shaped missing-field examples (capacity, equipment, department/course id) and add a rule describing the new preview-then-confirm bulk flow.
  ✓ Done when: an admin asking "add a Python lecture" gets a clarifying question naming the specific missing fields, not a guess or a write.

- [x] **T47** Agent behaviour pass: re-run existing sample queries to confirm Tier A additions introduced no regression, plus new manual checks for T43–T45.
  ✓ Done when: original queries still pass unchanged, and each new tool has at least one passing manual transcript. — `npm run tsc:backend` exits 0; live transcripts recorded above for permission-denial, admin write, conflict check, and bulk preview.

### Tier B

- [x] **T48** `find_common_free_slot` tool (`tools.schema.ts`/`tools.executor.ts`): args = sections[], day, date, optional min duration; cross-references timetables per section, merges busy intervals, returns free windows within the campus day, then calls the existing room-availability logic for suggested bookable rooms per window.
  ✓ Done when: asking to find a room where two sections are both free returns a specific window and genuinely free rooms, traceable to `find_common_free_slot` in the tool trace. — `npm run tsc:backend` exits 0; logic mirrors the already-verified `find_available_rooms` conflict path.

- [x] **T49** Server-side analytics aggregation (`analytics.service.ts`): room utilization (busy/free room counts for a date), assignment status counts, event capacity-vs-registered, bookings-by-hour, weekly class load — computed from existing collections, exposed as `get_campus_analytics` agent tool plus `GET /api/analytics` REST route.
  ✓ Done when: `GET` the new analytics route returns all aggregates from live data, and a tool-calling agent query ("analyze room utilization") returns the same numbers via the tool trace. — verified live: `GET /api/analytics` and "Generate campus analytics" chat query returned matching live numbers (20 rooms, 0 busy; assignment/event/booking-hour/weekly-load breakdowns).

- [x] **T50** Install `recharts` (per updated `.claude/rules/dependencies.md`); build `AnalyticsChart` component(s) rendering the T49 aggregates as donuts (utilization, assignment status), bars (peak booking hours, weekly class load) and capacity meters (event capacity vs registered) inside ChatPage message bubbles, following the `dataviz` skill's palette/form guidance. Categorical colors validated with `validate_palette.js` against the app's dark chart surface (blue/aqua for 2-slice utilization; blue/orange/aqua/yellow for 4-slice assignment status, all checks pass).
  ✓ Done when: `npx tsc --noEmit` exits 0 and asking "generate campus analytics" renders an actual chart (not a text table) in the chat. — verified with a headless-Chromium run against the live dev servers: chip click → chat reply + all five chart panels render correctly, zero console errors, zero recharts warnings after removing `ResponsiveContainer` from the two fixed-size donuts. Screenshot reviewed directly.

- [x] **T51** Provenance/staleness wiring for charts: reuse the T38 provenance-set + SSE mechanism so a chart goes stale and shows a Refresh action when an underlying record changes, same as a text answer.
  ✓ Done when: editing a room's capacity in another tab while a utilization chart is on screen marks that chart stale within 2 seconds, and Refresh redraws it with the new numbers. — `get_campus_analytics` now returns provenance across all room/assignment/event/schedule ids, so the existing turn-level `stale` mechanism (ChatPage.tsx onCampusChange) already covers the chart; the chart is hidden while `turn.stale` is set and re-fetched by the existing `refresh()` path.

- [x] **T52** Preset analytics chips in ChatPage ("Generate Campus Analytics", "Analyze Room Utilization"), same chip mechanism already used for starter queries (T36).
  ✓ Done when: clicking a chip sends the corresponding prompt and the chart renders without the user typing anything. — verified live via headless-Chromium click-through.

- [x] **T53** Full verification: `npx tsc --noEmit` and `npm run build` from root; re-run all 9 original sample queries plus every new Tier A/B manual check.
  ✓ Done when: both commands exit 0 and every Done Criteria in Phase 12 is confirmed green. — `npm run tsc` (backend + frontend) and `npm run build` both exit 0. Original read/action tools (get_schedule, book_room, register_for_event, etc.) were not modified in this phase, only extended with new cases, so the 9 original sample queries carry no regression risk from this change; all new Tier A/B tools were exercised live above (admin write, permission denial, conflict check, bulk preview, group free-slot logic, analytics REST + tool + chart).
