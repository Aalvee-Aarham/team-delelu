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
[backend/src/agent/tools.schema.ts] add 14 admin/bulk/analytics/group-slot tool defs | Tier A + B agentic capability expansion (T43-T49)
[backend/src/agent/tools.executor.ts] implement create/update/delete for schedules/rooms/events/assignments, conflict-checked create_schedule, preview-confirm bulk tools, find_common_free_slot, get_campus_analytics | same
[backend/src/agent/runner.ts] RULE 3 admin missing-field examples, RULE 5 conflict relay, new RULE 7 bulk preview-confirm | same
[backend/src/services/analytics.service.ts] created | campus-wide aggregates for agent + dashboard charts
[backend/src/routes/analytics.routes.ts] created, mounted at /api/analytics | REST access to the same aggregates
[.claude/rules/dependencies.md] add recharts | in-chat analytics charts (T50)
[frontend/src/components/AnalyticsChart.tsx] created | donut/bar/meter charts for campus analytics, dataviz-skill palette validated
[frontend/src/lib/types.ts] add CampusAnalytics type | shared with AnalyticsChart + ChatPage
[frontend/src/pages/ChatPage.tsx] fetch analytics on get_campus_analytics tool call, render chart, add analytics chips, add chart field to Turn | T50-T52
[frontend/package.json] add recharts@2 | T50
