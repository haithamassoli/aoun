# Exam And Deadline Calendar

## Summary

Build a new public student tool at /academic-planner that lets users create and manage personal academic events
entirely in localStorage, with no Convex or database integration. Use FullCalendar React
(https://fullcalendar.io/docs/react) as the calendar engine because its official React adapter supports month
view via dayGridMonth (https://fullcalendar.io/docs/month-view), weekly time-grid view, and scrollable time sl
ots via scrollTime in the main docs index: FullCalendar docs (https://fullcalendar.io/docs).

Use a server page for metadata/shell and nest a dedicated 'use client' calendar component for all interactive
state and browser APIs, matching Next’s client-boundary guidance: use client
(https://nextjs.org/docs/app/api-reference/directives/use-client). Keep package/global style imports predictab
le per Next App Router CSS guidance: CSS (https://nextjs.org/docs/app/getting-started/css).

## Key Changes

- Add a new public page app/academic-planner/page.tsx with Arabic copy, metadata, and the same animated entry
  pattern used by /gpa-calculator.
- Add a new header nav link beside the GPA calculator so the planner is discoverable without login.
- Create a client-side calendar module under components/academic-calendar/\* that owns:
  - FullCalendar setup with dayGridMonth and timeGridWeek
  - custom toolbar / segmented view switcher
  - date click and event click handlers
  - modal-based create/edit form using the existing modal pattern
  - success/error toasts using the existing toast utility
- Install and use @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, and @fullcalendar/
  interaction.
- Define a small local event model in a storage helper, for example:
  - AcademicCalendarCategory = "exam" | "registration" | "add_drop" | "project"
  - AcademicCalendarEvent = { id, title, category, start, end, allDay }
- Store data under a versioned key such as aoun:academic-calendar:v1, with safe parsing, sanitation, and
  graceful fallback to an empty state if storage is missing/corrupt/blocked.
- Keep v1 intentionally simple:
  - fixed, color-coded categories only
  - title
  - date
  - optional start time
  - optional end time
  - edit and delete
  - if no time is provided, persist the item as an all-day event
- Make the week view the “scroll view” by configuring a visible time range and initial scroll position
  appropriate for student schedules, while allowing horizontal overflow on narrow screens rather than
  collapsing the layout.
- Add calendar-specific .fc styling overrides to match the existing app theme and Arabic/RTL presentation
  without introducing a new design system or unrelated visual patterns.

## Public Interfaces / Types

- New client-only storage/type surface:
  - AcademicCalendarCategory
  - AcademicCalendarEvent
  - parse/load/save helpers for local storage
- No backend schema, Convex function, or server action changes.
- No authentication requirement for this tool.

- Manual browser verification on http://localhost:3000/academic-planner
- Confirm month and week views both render and switch correctly.
- Confirm week view opens with scrollable time slots and remains usable on mobile-width screens.
- Create one event per category and verify category colors/labels in both views.
- Create a date-only deadline and a timed exam; reload the page and verify both persist from localStorage.
- Edit an event, delete an event, and verify the UI and stored data stay in sync.
- Verify blocked/empty storage falls back cleanly without crashing the page.
- Check Next dev runtime for zero errors after integration.

## Assumptions And Defaults

- Placement is public, not dashboard-only.
- UI language follows the rest of the product: Arabic labels with an English route slug.
- Route slug default: /academic-planner.
- Package choice default: FullCalendar over alternatives because it already covers the required React, month,
  week, and scrollable time-grid needs from official docs.
- v1 excludes notes, reminders, recurrence, import/export, and cross-device sync.
- Data is intentionally device-local and not expected to appear across browsers or accounts.
