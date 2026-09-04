# Changes

[CLAUDE.md] created project index | Phase 0 context files
[.claude/rules/conventions.md] created | Phase 0 context files
[.claude/rules/banned.md] created | Phase 0 context files
[.claude/rules/dependencies.md] created | Phase 0 context files
[AGENT_INSTRUCTIONS.md] created | Phase 0 context files
[CHANGES.md] created | Phase 0 context files
[backend/src/agent/provider.gemini.ts] wrap array tool results in an object | Gemini functionResponse rejects lists, which broke the whole fallback tier
[backend/src/agent/provider.chain.ts] diversify Gemini links across 3 models | one model returning 503 no longer takes out the fallback
[backend/src/agent/tools.executor.ts] lean projections + truncation | Groq free tier is 8000 TPM and fat tool results exhausted it
[backend/src/agent/runner.ts] inject explicit 8-day date table | model mis-derived weekday dates (called Wednesday 09-07, actually 09-09)
[backend/src/agent/tools.schema.ts] purpose optional on book_room | agent asked a needless follow-up instead of booking
[backend/src/server.ts] graceful SIGINT/SIGTERM shutdown | tsx watch reloads failed with EADDRINUSE
