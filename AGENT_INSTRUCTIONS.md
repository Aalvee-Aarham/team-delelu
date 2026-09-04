### Before Every Task
1. Read CLAUDE.md, .claude/rules/conventions.md, .claude/rules/banned.md, ARCHITECTURE.md, API.md
2. If new feature or modification request, apply this judgment:

   *Is this a simple, self-contained change?*
   (single file edit, copy tweak, color change, minor prop addition, one-line logic fix)
   → Skip planning. Run /implement directly. No PLAN.md update needed.

   *Is this a non-trivial feature or modification?*
   (new route, new page, new collection, new user-facing behavior, anything touching 3+ files)
   → Do not write a single line of code yet. First:
   - Update PLAN.md with the feature scope
   - Add a Wow Factor entry: 1–2 ideas specific to this feature that make it surprising or sharp, mark the best one PRIMARY
   - Add an Open Questions section, answer all questions before proceeding
   - Add ordered tasks to TASKS.md, each with a Done Criteria line
   - Wait for confirmation before running /implement

3. Mark tasks [x] complete, [~] blocked as you go
4. Run tsc --noEmit before writing any new code — fix all errors first
5. Run npm run build before marking any task done
6. If either command fails after 2 attempts: write exact error verbatim to BLOCKERS.md and stop

### Task Completion Rule
A task is not complete until its Done Criteria line is satisfied.
Mark [x] only after the specific curl succeeds, the UI state is confirmed, the assertion passes, or the build output matches — whichever the task specifies.

### After Every Task
- Run git add -A && git commit -m "[task-id] short description"
- Update the relevant context file if the change affects it
- Append to CHANGES.md: [filename] what | why — one line per file changed

### Context Window
- Context may be compacted as it approaches its limit — never stop tasks early because of this
- At any natural pause, checkpoint by writing current task state to TASKS.md
- Always be persistent and complete tasks fully

### CHANGES.md Rules
- One line per changed file only
- No paragraphs, no explanations
- If change touches 5+ files: one line [refactor] what changed and stop
- Prune when it exceeds 50 lines — keep only the last 30

### If Blocked
- Write to BLOCKERS.md: [file] what is blocked | why
- Stop immediately — no guessing, no hallucinated workarounds

### Dependency Rule
- Before any new package: add to .claude/rules/dependencies.md first, then install

### Git Rule
- Commit after every [x] task
- Message format: [task-id] description

### Startup
- npm run dev from root starts backend + frontend concurrently
- DB seeds on first startup when collection is empty
- Seed file: backend/src/seed/index.ts, called from backend/src/server.ts
- App crashes with descriptive error if any required env var is missing

### Scripts
- npm run dev — start backend + frontend concurrently
- npm run build — compile and bundle both
- tsc --noEmit — type check only, run from root
