# Integrate Persistent Pomodoro Timer Into /focus

## Summary

- Ship the timer inside the existing focus experience only. The clarified scope overrides the original /study-timer
  path request, so there will be no new route or redirect.
- Keep the route page server-rendered and add the interactive timer through the existing client-side focus UI.
- Use a separate timer provider with versioned localStorage persistence so the session survives refreshes and
  student-facing route changes, and expose a compact floating timer pill across public pages.

## Implementation Changes

- Add a StudyTimerProvider and useStudyTimer hook, mounted under the existing focus audio provider in app/
  layout.tsx, so timer state is global and the floating timer can stack above the existing floating audio player
  instead of overlapping it.
- Render a full timer panel at the top of components/focus-sound-studio.tsx, above the current sound controls. The
  panel should show:
  - Current phase
  - Large countdown
  - Completed work sessions in cycle (n/target)
  - Today total
  - 7-day total
  - Start, pause/resume, and reset actions
  - Collapsible settings for work minutes, short break minutes, long break minutes, and sessions per cycle
- Add a separate floating timer pill, visible on student-facing routes while the timer is running or paused. It
  should follow the mock’s shape: left cycle badge, middle rounded countdown/quick-actions area, right pause/resume
  control.
- Make the pill’s gear action navigate or scroll to /focus#study-timer, and make its close action stop the active
  timer session without clearing historical totals.
- Update focus-page copy and loading skeleton so /focus clearly presents “timer + sounds” instead of “sounds only”.
  Update student-tool descriptions accordingly, but keep the existing /focus route and focus nav entry.
- Add versioned storage keys in lib/local-storage-keys.ts plus a new timer storage/helper module. Persist:
  - Runtime timer state
  - User timer settings
  - Historical work-time buckets by local date
- Accrue study totals from work phases only. Do not count short or long breaks.
- Derive weekly total as a rolling 7-day sum. Split elapsed work across local midnight boundaries so day totals stay
  correct.
- Use absolute timestamps (phaseEndsAt, paused remaining time, last reconciliation time) as the source of truth. The
  UI tick should only derive display state from timestamps, not decrement canonical state every second.
- Auto-advance phases: work -> short break, and after sessionsPerCycle completed work sessions -> long break.
- Apply setting edits immediately when idle or paused, and starting with the next phase when the timer is actively
  running.
- Keep timer behavior independent from focus sounds. Phase changes do not auto-pause, resume, or stop audio.

## Public Interfaces / State

- New timer settings model:
  - workMinutes default 25, max 120
  - shortBreakMinutes default 5, max 60
  - longBreakMinutes default 15, max 90
  - sessionsPerCycle default 4, max 12
- New timer runtime model:
  - status: idle | running | paused
  - phase: work | shortBreak | longBreak
  - completedWorkSessionsInCycle
  - phaseEndsAt
  - pausedRemainingMs
- New persisted history model:

- Verify /focus renders the new inline timer panel and the sound grid still behaves as before.
- Start a default session, confirm countdown accuracy, 0/4 progress, and live “today” accumulation.
- Pause, resume, and reset from both the inline panel and the floating pill; both surfaces must stay synchronized.
- Change custom durations and cycle size, then verify the next phases follow the customized schedule.
- Confirm long break starts after the configured number of completed work sessions.
- Navigate from /focus to another student-facing route and refresh; timer remains accurate and the floating pill
  stays available.
- Open /login or /dashboard; pill hides there, and returning to a public page restores the active session.
- Run sounds and timer together; floating timer and floating audio player do not overlap on mobile or desktop.
- Verify work totals exclude breaks and split correctly across midnight.
- Run npm run lint and verify browser runtime errors remain zero in Next.js devtools.

## Assumptions

- No /study-timer route will be created.
- “Per week” means rolling 7 days, not a locale-specific calendar week.
- Notifications stay visual-only unless reusing the existing toast pattern is trivial during implementation.
