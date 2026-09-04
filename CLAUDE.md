# CampusOS

Campus data manager + AI agent with real tool calling over live MongoDB data.

## Stack
Node 20, Express 4, TypeScript 5, Mongoose 8, zod 3, jsonwebtoken 9, bcryptjs 2 (backend)
React 18, Vite 5, TypeScript 5, @tanstack/react-query 5, axios 1, Tailwind 3, shadcn/ui (frontend)
Groq (openai/gpt-oss-120b) primary LLM, Gemini (gemini-3.8-flash) fallback

## Run
- `npm run dev` — backend (4000) + frontend (5173) concurrently, from root
- `npm run build` — compile + bundle both
- `npx tsc --noEmit` — type check only, from root

## Ports
Backend **4000**, frontend **5173**. Never change these.

## Rules
- Conventions → `.claude/rules/conventions.md`
- Banned patterns → `.claude/rules/banned.md`
- Dependencies → `.claude/rules/dependencies.md`

## Docs
- Architecture → `ARCHITECTURE.md`
- API routes → `API.md`
- Build plan → `PLAN.md`, `TASKS.md`
