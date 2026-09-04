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
[backend/src/agent/provider.types.ts] add ToolCall.geminiThoughtSignature | Gemini rejects a functionCall replayed without the exact signature it issued
[backend/src/agent/provider.gemini.ts] capture thoughtSignature on Gemini's own tool calls, replay it back verbatim; collapse cross-provider tool-call turns (e.g. after Groq->Gemini failover) to plain text instead of a forged functionCall | fixes "Internal server error" (all providers failed) whenever a multi-round tool loop failed over to Gemini mid-conversation — confirmed live pre-fix reproduction and post-fix success
[.claude/rules/dependencies.md] add @aws-sdk/client-polly, @aws-sdk/client-transcribe-streaming | voice feature (T54-T58)
[backend/src/config/env.ts] add AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION | voice feature AWS credentials
[backend/.env.example] add AWS placeholders | same
[backend/.env] add real AWS credentials (gitignored, never committed) | user supplied these directly in chat — flagged for rotation
[backend/src/services/voice.service.ts] created | Polly synthesizeSpeech + Transcribe streaming transcribeAudio
[backend/src/routes/voice.routes.ts] created, mounted at /api/voice | POST /speak (text->mp3), POST /transcribe (pcm->text)
[frontend/src/lib/voice.ts] created | browser-side PCM capture/resample (VoiceRecorder), transcribeAudio, speakText API calls
[frontend/src/pages/ChatPage.tsx] add mic button (record/stop, populates+sends transcribed text) and speaker button per reply bubble | T57
[frontend/package.json] no new frontend deps — voice uses native MediaDevices/AudioContext + existing axios instance
