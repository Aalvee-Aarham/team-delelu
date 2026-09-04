# CampusOS

AI-powered campus platform: dashboard for schedules/rooms/events/announcements/assignments, plus a chat agent with real tool calling over live data.

## Prerequisites
Node 20+, a MongoDB Atlas URI, Groq + Gemini API keys.

## Run
```
npm install
cp backend/.env.example backend/.env   # fill in real values
npm run dev
```
Backend on http://localhost:4000, frontend on http://localhost:5173.

## Env Vars
See `backend/.env.example`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `GROQ_API_KEY_1/2`, `GEMINI_API_KEY_1/2`, `LLM_TIMEOUT_MS`.

## Using the Agent
Log in (demo: student@campusos.edu / campus123), open Chat, ask things like "When is my next class?", "Book Room 7A02 tomorrow 3-5 PM", "Register me for the Guest Lecture".
