# Dependencies

## Backend
- express 4 — HTTP server
- mongoose 8 — MongoDB ODM
- zod 3 — env + request validation
- jsonwebtoken 9 — JWT auth
- bcryptjs 2 — password hashing
- cors 2 — cross-origin for the frontend dev server
- dotenv 16 — load `.env` in development
- @aws-sdk/client-polly — text-to-speech for the agent's spoken replies
- @aws-sdk/client-transcribe-streaming — speech-to-text for the user's spoken questions
- multer 2 — multipart parsing for assignment submissions and event cover uploads
- uploadthing 7 — UTApi server SDK, used for admin event cover images
- tsx 4 (dev) — run the TypeScript backend without a build step
- typescript 5 (dev) — type checking

## Frontend
- react 19, react-dom 19 — UI
- react-router-dom 7 — routing
- @tanstack/react-query 5 — server state
- axios 1 — HTTP client
- tailwindcss 4 + @tailwindcss/vite — styling (CSS-first config in `src/index.css`)
- shadcn/ui — UI primitives, added only via `npx shadcn@latest add <component>`
  - installed: button, card, input, label, dialog, table, badge, select, textarea, sonner, skeleton
- @base-ui/react — headless primitives that shadcn components build on (pulled in by the CLI)
- class-variance-authority — variant styling (pulled in by the CLI)
- cn — className merge helper (pulled in by the CLI)
- sonner — toasts
- next-themes — theme provider required by shadcn's sonner wrapper
- lucide-react — icons
- recharts — charts for in-chat analytics widgets (pie/bar/timeline), pairs with shadcn's `chart` component
- vite 8, @vitejs/plugin-react — build tooling
- typescript 6 (dev) — type checking

## Root
- concurrently 9 — run backend + frontend together
- npm-run-all2 8 — run scripts in sequence without shell `&&`, which fails when
  npm's script-shell is PowerShell (PowerShell 5.1 has no `&&` operator)
- typescript 5 — root type-check script

## Notes
Tailwind v4 was chosen over v3 because the current shadcn CLI requires v4's CSS-first
configuration and refuses to initialise against a v3 `tailwind.config.js`.
