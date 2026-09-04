# API Routes

| Method | Path | Handler | Request | Response |
|---|---|---|---|---|
| GET | /health | health | — | `{status:"ok",timestamp}` |
| POST | /api/auth/register | register | `{name,email,password,student_id,section}` | `{token,user}` |
| POST | /api/auth/login | login | `{email,password}` | `{token,user}` |
| GET | /api/auth/me | me | — | `{user}` |
| GET | /api/schedules | listSchedules | `?day&course&section` | `Schedule[]` |
| POST | /api/schedules | createSchedule (admin) | `Schedule` | `Schedule` |
| PATCH | /api/schedules/:id | updateSchedule (admin) | `Partial<Schedule>` | `Schedule` |
| DELETE | /api/schedules/:id | deleteSchedule (admin) | — | `{deleted:true}` |
| GET | /api/rooms | listRooms | `?type&min_capacity&equipment` | `Room[]` |
| POST | /api/rooms | createRoom (admin) | `Room` | `Room` |
| PATCH | /api/rooms/:id | updateRoom (admin) | `Partial<Room>` | `Room` |
| DELETE | /api/rooms/:id | deleteRoom (admin) | — | `{deleted:true}` |
| GET | /api/rooms/availability | availability | `?date&start_time&end_time&min_capacity&equipment` | `{available:Room[],conflicts:[]}` |
| POST | /api/rooms/:room_number/book | bookRoom | `{date,start_time,end_time,purpose}` | `Booking` |
| DELETE | /api/bookings/:booking_id | cancelBooking | — | `{deleted:true}` |
| GET | /api/events | listEvents | `?status&date` | `Event[]` |
| POST | /api/events | createEvent (admin) | `Event` | `Event` |
| PATCH | /api/events/:id | updateEvent (admin) | `Partial<Event>` | `Event` |
| DELETE | /api/events/:id | deleteEvent (admin) | — | `{deleted:true}` |
| POST | /api/events/:id/register | registerEvent | — | `Event` |
| DELETE | /api/events/:id/register | cancelRegistration | — | `Event` |
| GET | /api/announcements | listAnnouncements | `?priority&active` | `Announcement[]` |
| POST | /api/announcements | createAnnouncement (admin) | `Announcement` | `Announcement` |
| PATCH | /api/announcements/:id | updateAnnouncement (admin) | `Partial<Announcement>` | `Announcement` |
| DELETE | /api/announcements/:id | deleteAnnouncement (admin) | — | `{deleted:true}` |
| GET | /api/assignments | listAssignments | `?status&course&due_before` | `Assignment[]` |
| POST | /api/assignments | createAssignment (admin) | `Assignment` | `Assignment` |
| PATCH | /api/assignments/:id | updateAssignment (admin) | `Partial<Assignment>` | `Assignment` |
| DELETE | /api/assignments/:id | deleteAssignment (admin) | — | `{deleted:true}` |
| GET | /api/me/bookings | myBookings | — | `Booking[]` |
| GET | /api/me/registrations | myRegistrations | — | `Event[]` |
| POST | /api/agent/chat | agentChat | `{messages[]}` | `{reply,toolCalls[],provider,model,latencyMs}` |
| GET | /api/agent/health | agentHealth | — | `{chain:[{provider,model,ok}]}` |
| GET | /api/stream | sseStream | — | SSE: `{type:"change",collection,action,id,at}` |

All routes except /health and /api/auth/* require `Authorization: Bearer <jwt>`. Admin-only routes reject non-admin tokens with 403.

## Courses

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/courses` | any | Filters: `archived`, `code` |
| GET | `/api/courses/:id` | any | |
| POST | `/api/courses` | admin | |
| PATCH | `/api/courses/:id` | admin | |
| DELETE | `/api/courses/:id` | admin | |
| GET | `/api/courses/:id/stream` | any | `{ course, assignments, announcements, submissions }`. Students get only their own submissions; admins get every student's. |
| POST | `/api/courses/:id/enroll` | any | Join the course |
| DELETE | `/api/courses/:id/enroll` | any | Leave the course |

## Submissions

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/submissions` | any | Students see only their own. Filters: `assignment_id`, `course_id`, `status` |
| GET | `/api/submissions/:id` | any | Same scoping |
| POST | `/api/submissions` | student | Upsert on (assignment, student). Body: `assignment_id`, `text`, `attachments[]`. Needs at least text or one file. Sets `late` against the deadline. 409 once accepted or rejected. |
| PATCH | `/api/submissions/:id/review` | admin | Body: `status` (submitted/accepted/returned/rejected), `grade`, `feedback`. Grade above the assignment total is rejected. |
| DELETE | `/api/submissions/:id` | owner or admin | Owners may withdraw only while still `submitted` |

## Comments

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/comments` | any | Filters: `target_type`, `target_id`, `course_id` |
| POST | `/api/comments` | any | Body: `target_type` (assignment/announcement/course/event/submission), `target_id`, `course_id`, `parent_id`, `body`. Replies are one level deep only. |
| DELETE | `/api/comments/:id` | author or admin | Deleting a root also deletes its replies |

## Uploads

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/uploads/config` | any | `{ submissions, images, maxMb }` — which provider is live |
| POST | `/api/uploads/submissions` | any | multipart, field `files`, up to 5. Cloudinary, or disk when unconfigured |
| POST | `/api/uploads/images` | admin | multipart, field `file`, images only. UploadThing, or disk when unconfigured |
| GET | `/api/uploads/files/:name` | public | Serves the disk fallback so `<img>` tags work without a header |
