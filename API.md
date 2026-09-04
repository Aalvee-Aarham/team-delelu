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
