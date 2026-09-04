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
[frontend/src/index.css] replaced dark theme with the paper/ink design tokens | frontend/ref is a light editorial design system, the old theme contradicted it
[frontend/index.html] load Inter + JetBrains Mono, real page title | ref specifies Inter across the whole type scale
[frontend/src/lib/tone.ts] created semantic tone maps | Tailwind cannot build class names dynamically, so status colours need explicit lookup tables
[frontend/src/lib/nav.ts] created grouped nav config | sidebar and topbar both need the same route metadata
[frontend/src/components/{Panel,StatTile,StatusPill,FilterTabs,EmptyState,Meter,DataTable,RowActions,MetaCell,Decor,Brand}.tsx] created shared primitives | every page was repeating card, badge and filter markup
[frontend/src/components/{Sidebar,Topbar,Shell}.tsx] split shell into grouped sidebar + topbar | one flat nav list gave no sense of sections, and there was no mobile navigation
[frontend/src/components/{AuthLayout,BookRoomDialog,ChatTurn,NextClassPanel}.tsx] created | kept LoginPage, RoomsPage, ChatPage and DashboardPage under the 300-line rule
[frontend/src/lib/schedule.utils.ts] moved nextClass out of DashboardPage | DashboardPage was 339 lines and a component was importing from pages/
[frontend/src/components/ui/*.tsx] restyled variants to the paper tokens | shadcn primitives still carried the old dark palette
[frontend/public/background.png] copied from ref/ | ref/ is not served by Vite, the auth poster panel needs a real URL
[frontend/src/pages/LandingPage.tsx + components/landing/*] created public landing page | signed-out visitors landed straight on a login form with no explanation of what CampusOS is
[frontend/src/hooks/useMotion.ts] created scroll/parallax/reveal/tilt/count-up/typewriter hooks | the landing sections share one set of motion primitives, and each must no-op under prefers-reduced-motion
[frontend/src/index.css] added reveal, parallax, marquee, tilt and hover-microtransition utilities | Tailwind has no scroll-reveal or parallax primitive, and the reduced-motion reset belongs in one place
[frontend/src/lib/scroll.ts] created scrollToSection | hero and nav both scroll to sections, and exporting it from LandingNav broke fast refresh
[frontend/src/App.tsx] signed-out "/" renders the landing page, "*" redirects there | login is now a destination rather than the front door
[frontend/src/components/AuthLayout.tsx] brand and a back link route to "/" | there was no way back out of the auth screens
[backend/src/models/{course,submission,comment}.model.ts] created | Google Classroom structure needs a course container, per-student submissions and threaded comments
[backend/src/models/assignment.model.ts] added course_id, attachments, accepts_text/accepts_files | assignments had no course to group under and no way to carry reference material
[backend/src/models/event.model.ts] added image_url/image_credit/image_provider | the events page was text-only
[backend/src/models/announcement.model.ts] added course_id | notices posted into a course stream vs campus-wide
[backend/src/routes/{courses,submissions,comments,uploads}.routes.ts] created | students could not hand work in and admins could not review it
[backend/src/services/{cloudinary,uploadthing,upload.types}.service.ts] created | submission files go to Cloudinary, admin images to UploadThing, both falling back to disk
[backend/src/services/cloudinary.service.ts] sanitise folder into the local filename | "campusos/submissions" became a directory path and writeFileSync hit ENOENT
[backend/src/services/uploadthing.service.ts] use the global File rather than UTFile | UTFilePropertyBag resolves without `type` under lib ES2022, so UTFile could not carry the mime type
[backend/src/config/env.ts] optional upload secrets, empty string treated as unset | a blank CLOUDINARY_* line in .env must not crash startup
[backend/src/seed/backfill.ts] created | events and assignments were already seeded, so new fields needed filling in place
[data/courses.json] created with 11 courses and Unsplash covers | the course grid needs real imagery in the demo database
[data/{submissions,comments}.json] created | the review inbox and comment threads should not open empty in a demo
[data/events.json] Unsplash cover per event | the request was for images on the events page
[backend/src/agent/tools.{schema,executor}.ts] added get_courses and get_submissions | the agent could not answer "what have I handed in" or "was my work accepted"
[frontend/src/pages/{CoursesPage,CourseDetailPage,AssignmentDetailPage,SubmissionsPage}.tsx] created | the Classroom flow: course grid, stream/classwork/people tabs, hand-in page, review inbox
[frontend/src/components/{CourseCard,CourseBanner,CourseStreamTab,SubmitWorkPanel,SubmissionReviewCard,CommentThread,FilePicker,ImagePicker,AttachmentList}.tsx] created | shared pieces of the submission and comment flows
[frontend/src/hooks/{useClassroom,useUpload}.ts] created | course stream, submissions, comments and multipart uploads as react-query hooks
[frontend/src/components/FormDialog.tsx] added an `extra` slot | the course and event dialogs need an image picker the field list cannot express
[frontend/src/pages/AssignmentsPage.tsx] grouped by course, linked to the detail page | a flat deadline list gave no sense of which class work belonged to
[frontend/src/pages/EventsPage.tsx] cover image, credit and a comment thread per event | events were text-only cards
[frontend/src/pages/AnnouncementsPage.tsx] course tag and comment threads | notices are part of a course stream in Classroom
