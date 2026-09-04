# Conventions

- Naming: camelCase for variables/functions, PascalCase for components/types, kebab-case for filenames.
- File length: max 300 lines. Split into `<name>.utils.ts`, `<name>.types.ts`, `<name>.hooks.ts` as needed.
- Auth: JWT via `jsonwebtoken` + `bcryptjs`. Token sent as `Authorization: Bearer <token>`.
- Error handling: global Express error middleware at `backend/src/middleware/error.ts`. Route handlers call `next(err)` — no per-route try/catch.
- Env validation: zod schema at startup in `backend/src/config/env.ts`. Crash with a clear message naming the missing variable.
- HTTP client: axios with one shared instance at `frontend/src/lib/axios.ts`.
- Server state: `@tanstack/react-query` for all server state on the frontend. No manual fetch+useState for server data.
- shadcn/ui: components added only via `npx shadcn@latest add <component>` — never hand-written.
- Imports: only import what is used in that file.
