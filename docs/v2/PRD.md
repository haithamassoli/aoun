# Aoun — PRD v2

## Summary
Scope v2 upgrades Aoun from browse-only catalog pages to searchable catalog + admin operations. Admin gets full CRUD for all entities with soft delete. Public pages get indexed search for universities, majors, and courses using normalized Arabic/English tokens. Students get local progress state per course and automatic return to the last major from `/`.

## Goals
- Enable full admin management for all entities in dashboard.
- Keep contributor behavior from v1 unchanged.
- Add fast public search using Convex Search Indexes.
- Add lightweight student progress persistence without accounts.
- Add basic admin analytics for catalog coverage.

## Roles
- `admin`
- `contributor`
- `public student`

## Scope
### In scope
- Admin CRUD for `universities`, `majors`, `courses`, `resources`, `users`, `permissions`.
- Soft delete for all entities (backend state only, no restore flow).
- New `alias` field (single string) for `universities`, `majors`, `courses`.
- New `searchToken` field and Convex search indexes (public pages only).
- Public search UI:
- Universities page: search universities.
- Major page (inside one university): search majors in that university.
- Courses page (inside one major): search courses in that major.
- Admin analytics:
- Total universities.
- Total majors.
- Total courses.
- One bar chart for the same three totals.
- Student local storage:
- Course status (`Completed`, `In Progress`, `None`) by `courseId`.
- Persist last opened major and redirect from `/` to that major path when valid.

### Out of scope
- Restore UI for soft-deleted rows.
- Contains search behavior.
- Auth changes.
- Public student accounts or sync across devices.
- Time-series analytics.

## Functional Requirements

### 1) RBAC and CRUD
1. `admin` can create, read, update, and soft-delete all entities:
   `universities`, `majors`, `courses`, `resources`, `users`, `permissions`.
2. `contributor` retains v1 behavior:
   manage only allowed content in assigned majors (resources/courses where applicable).
3. All mutations enforce role checks server-side in Convex.

### 2) Soft Delete (all entities)
1. Delete action sets soft-delete fields, never hard-deletes records.
2. Soft-deleted records are excluded by default from:
   public pages, dashboard lists, search results, analytics counts, and relation pickers.
3. Uniqueness checks must apply to non-deleted rows only, so deleted values can be reused.
4. No restore endpoint/UI in v2.

### 3) Alias and Search Token
1. Add `alias: string` (optional, default empty string) to:
   `universities`, `majors`, `courses`.
2. Add `searchToken: string` to:
   `universities`, `majors`, `courses`.
3. `searchToken` is generated on create/update from:
   - universities: `name + slug + alias`
   - majors: `name + slug + alias`
   - courses: `name + slug + alias + courseCode`
4. `searchToken` generation must normalize Arabic and English text before saving.

### 4) Public Search Behavior
1. Use Convex Search Indexes. Do not implement contains search.
2. Universities page:
   - Search against universities index.
   - Filter to non-deleted universities.
3. Major page:
   - Search majors index.
   - Filter by `universityId` and non-deleted.
4. Courses page:
   - Search courses index.
   - Filter by `majorId` and non-deleted.
5. Empty query returns default list order from existing sort rules.

### 5) Analytics Dashboard (admin only)
1. Show three KPI totals (non-deleted rows only):
   - universities count
   - majors count
   - courses count
2. Show one bar chart with three bars for those totals.
3. Data refreshes live with Convex queries.

### 6) Student Local Storage
1. Course progress status is stored per `courseId`.
2. Status enum:
   - `completed`
   - `in_progress`
   - `none`
3. On course card/page, student can set status.
4. If no stored value exists, status is `none`.

### 7) Last Major Redirect
1. Store last opened major in Local Storage whenever student visits a major page.
2. On base path `/` only:
   - Read stored last major.
   - Validate major + university still exist and are not soft-deleted.
   - If valid, redirect to `/{universitySlug}/{majorSlug}`.
   - If invalid/missing, stay on `/` silently.
3. No redirect behavior on non-root paths.

## Data Model Changes (Convex)

### universities
- add `alias?: string`
- add `searchToken: string`
- add soft delete fields:
  - `deletedAt?: number`
  - `deletedBy?: Id<"users">`

### majors
- add `alias?: string`
- add `searchToken: string`
- add soft delete fields:
  - `deletedAt?: number`
  - `deletedBy?: Id<"users">`

### courses
- add `alias?: string`
- add `searchToken: string`
- add soft delete fields:
  - `deletedAt?: number`
  - `deletedBy?: Id<"users">`

### resources
- add soft delete fields:
  - `deletedAt?: number`
  - `deletedBy?: Id<"users">`

### users
- add soft delete fields:
  - `deletedAt?: number`
  - `deletedBy?: Id<"users">`

### permissions
- add soft delete fields:
  - `deletedAt?: number`
  - `deletedBy?: Id<"users">`

## Search Normalization Spec

### Arabic normalization
- Remove Arabic diacritics.
- Normalize `أ`, `إ`, `آ` -> `ا`.
- Normalize `ى`, `ئ` -> `ي`.
- Normalize `ة` -> `ه`.

### English/general normalization
- Lowercase.
- Trim leading/trailing spaces.
- Collapse repeated spaces to one space.
- Replace separators (`-`, `_`, `/`) with space.
- Remove punctuation noise where possible.

### Token build rule
1. Collect source fields in order.
2. Drop null/empty values.
3. Normalize each value.
4. Join with single spaces.
5. Store as `searchToken`.

## Indexing Requirements (Convex)
- Universities search index on `searchToken`, filter on soft-delete state.
- Majors search index on `searchToken`, filter by `universityId` and soft-delete state.
- Courses search index on `searchToken`, filter by `majorId` and soft-delete state.
- Keep existing relation indexes from v1.

## API/Mutation Rules
- On create/update for universities/majors/courses:
  - Recompute `searchToken`.
- On soft delete:
  - Set `deletedAt = now()`.
  - Set `deletedBy = currentUserId`.
- All read queries used by public pages must include non-deleted filter.
- Analytics queries must count only non-deleted rows.

## UI Requirements
- Dashboard admin sections support create/edit/delete for all entities.
- Delete actions must clearly indicate "soft delete".
- Public list pages include search input with debounced query.
- Course UI includes status selector (Completed / In Progress / None).

## Acceptance Criteria
1. Admin can CRUD all six entities from dashboard; delete does not remove rows physically.
2. Contributor permissions behave exactly as v1 (no privilege expansion).
3. Soft-deleted records never appear in public pages, default admin lists, search, or analytics.
4. `alias` is editable and included in searchable behavior.
5. Search works on public pages with Convex Search Indexes and no contains mode.
6. Arabic normalization rules are applied exactly as specified before indexing.
7. Universities search returns matching universities only.
8. Major search returns results only inside the selected university.
9. Course search returns results only inside the current major.
10. Analytics shows correct totals and one bar chart for universities/majors/courses.
11. Student status persists by `courseId` in Local Storage and survives reload.
12. Visiting `/` redirects to stored major path only when stored target is valid and non-deleted.

## Migration Notes
- Backfill `alias` with empty string where missing.
- Backfill `searchToken` for all existing universities/majors/courses.
- Backfill `deletedAt/deletedBy` as null for existing data.
- Deploy schema and indexes before enabling public search UI.
