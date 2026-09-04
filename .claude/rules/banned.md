# Banned Patterns

- No comments, no JSDoc, no inline explanations.
- No TODOs, no stubs, no `return null` as a placeholder.
- No empty catch blocks.
- No per-route try/catch (use the global error middleware).
- No hardcoded strings that belong in env.
- No new dependency without first adding an entry to `.claude/rules/dependencies.md`.
