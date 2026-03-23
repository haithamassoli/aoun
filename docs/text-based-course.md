# Support Text-Based Course Grouping Labels

## Summary

Change courses.semester from an optional number to an optional string and keep the field name unchanged. This
supports existing numeric values like 1 and branch/group labels like القدرة or الاتصالات without adding a
separate field.

## Key Changes

- Convex data model:
  - Update courses.semester in the schema and all Convex validators/return types from v.optional(v.number())
    to v.optional(v.string()).
  - Keep API field name as semester to avoid a wider refactor.
  - In add and update, normalize with trim(), and store undefined when the input is empty.
- Course admin/contributor flows:
  - In convex/courses.ts, accept semester as optional string in mutations and returned course objects.
  - In convex/dashboard.ts, update every course-shaped validator and response to use string semester.
  - In app/dashboard/admin/courses/page.tsx and app/dashboard/major/[majorId]/page.tsx:
    - keep form state as string
    - stop coercing with Number(...)
    - change the semester input from numeric to text
    - update labels/help text to clarify this field can be a study level or branch/group label
    - show the stored label in list rows, using friendly numeric display only when the stored string is
      purely numeric
- Public major page grouping:
  - In components/courses-search-section.tsx, change grouping from number | null to string | null.
  - Add a small formatter:
    - if semester is empty: treat as ungrouped and label as مواد أخرى
    - if semester is a numeric string like "1": display المستوى الأول style labels
    - otherwise: display the raw text exactly as stored
  - Sort courses first by order, then build groups in first-seen order from that sorted list. This preserves
    stable ordering for both numeric and textual labels without forcing alphabetical grouping.
  - Reuse the same formatter for search result badges and dashboard list subtitles so numeric strings still
    read cleanly while branch labels remain exact.
- Data compatibility:
  - Add a one-off backfill step to convert existing numeric courses.semester values in the database to
    strings before relying on the new schema end to end.
  - Regenerate Convex types after the schema change so the app compiles against the updated field type.

## Public Interface Changes

- courses.semester:
  - before: number | undefined
  - after: string | undefined
- No new field is introduced.
- Existing UI form payloads keep the same key, but the value is now submitted as trimmed text.

## Assumptions

- Chosen model: one optional text field only; no separate branch/track field.
- Numeric values remain supported, but only as strings at rest.
- Group ordering on the public major page follows the first appearance in course order, not alphabetical
  sorting.
