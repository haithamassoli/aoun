# Add Course Credits End-to-End

## Summary

Add a required credits field to every course, default it to 3 in both admin and contributor course forms,
backfill existing course documents to 3, and make CourseProgressStats use credit-weighted totals instead of
course-count totals.

## Implementation Changes

- Data model and Convex APIs
  - Add credits: v.number() to the courses table in convex/schema.ts.
  - Treat credits as a required integer credit-hour value, with UI default 3.
  - Extend course return validators and payloads in the relevant Convex course/dashboard functions so credits
    is included anywhere course docs are returned:
    - api.courses.listByMajor
    - api.courses.searchByMajor
    - api.courses.getBySlug
    - api.courses.getByMajorAndSlug
    - api.dashboard.getCoursesForMajor
    - api.dashboard.adminListCourses
  - Extend api.courses.add and api.courses.update to accept and persist credits.
- Migration and defaults
  - Add a new internal migration in convex/migrations.ts that patches any existing course missing credits to 3.
  - Keep creation/edit flows explicit: forms submit a concrete credits value rather than relying on implicit
    backend defaults.
  - Do not leave legacy runtime fallbacks in place after the migration path is added; the target state is
    that all course docs have credits.
- Admin and contributor course management
  - Extend courseSchema and contributorCourseSchema in lib/schemas.ts with a credits field validated as a
    numeric string for the form layer.
  - In app/dashboard/admin/courses/page.tsx:
    - Add credits: "3" to form defaults.
    - Add a numeric credits input to the course modal.
    - Include credits in edit reset values and add/update mutation payloads.
    - Show credits in the course list metadata so admins can see the stored value.
  - In app/dashboard/major/[majorId]/page.tsx:
    - Add the same credits form field/default/reset/submit handling.
    - Extend the local CourseListItem type with credits.
    - Show credits in the contributor course list row metadata.
- Public course search and progress stats
  - Extend CourseListItem in components/courses-search-section.tsx to include credits.
  - Keep status filter button counts course-based.
  - Change CourseProgressStats to be credit-weighted:
    - totalCredits = sum(all course credits)
    - hiddenCredits = sum(hidden course credits)
    - visibleCredits = totalCredits - hiddenCredits
    - completedCredits and inProgressCredits summed by status
    - noneCredits = visibleCredits - completedCredits - inProgressCredits
    - Percentages calculated from visible credits, with hidden percentage from total credits
  - Update the card copy and summary numbers to say credits/hours instead of course counts, e.g. completed X%
    and completedCredits / visibleCredits.

## Assumptions

- credits is required for every course after rollout.
- credits is an integer credit-hour value and should be entered through a numeric input.
- Default credits for new courses and migrated legacy courses is 3.
- Only CourseProgressStats becomes credit-weighted; the status filter pills remain course-count based.
