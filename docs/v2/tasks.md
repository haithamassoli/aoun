# Scope v2 Milestones and Tasks

This file contains the task-level execution plan for each milestone in `docs/v2/PRD.md`.

## M1 — Data Model and Migration Foundation

1. `M1-T1` Update Convex schema for all entities with soft-delete fields: `deletedAt`, `deletedBy`.
2. `M1-T2` Add `alias` and `searchToken` fields to `universities`, `majors`, `courses`.
3. `M1-T3` Implement shared normalization utility with PRD rules for Arabic and English processing.
4. `M1-T4` Implement `buildSearchToken` helper per entity shape (universities, majors, courses).
5. `M1-T5` Add Convex search indexes for universities, majors, and courses with scope-ready filters.
6. `M1-T6` Add/confirm relation indexes required for scoping queries by `universityId` and `majorId`.
7. `M1-T7` Create migration/backfill script for `alias`, `searchToken`, and null soft-delete defaults.
8. `M1-T8` Run migration in dev and verify document counts before/after migration are stable.
9. `M1-T10` Document migration run order and rollback notes.
10. `M1-GATE` Schema deployed, indexes built, and all existing universities/majors/courses have valid `searchToken`.

## M2 — Authorization and Soft Delete Enforcement

1. `M2-T1` Refactor RBAC helper(s) to centralize role checks for admin and contributor.
2. `M2-T2` Implement admin full CRUD permissions for `universities`, `majors`, `courses`, `resources`, `users`, `permissions`.
3. `M2-T3` Keep contributor restrictions exactly as v1 for assigned-major operations.
4. `M2-T4` Replace hard delete mutations with soft delete mutations on all entities.
5. `M2-T5` Add default non-deleted filters to all read queries used by public and dashboard screens.
6. `M2-T6` Update uniqueness checks to ignore soft-deleted rows for `slug` and `courseCode` collisions.
7. `M2-T7` Ensure relation lookup queries exclude soft-deleted records by default.
8. `M2-GATE` Permission matrix passes and deleted rows are hidden across read/search/analytics paths.

## M3 — Admin Dashboard CRUD Completion

1. `M3-T1` Build/finish admin list pages for all six entities with default non-deleted data.
2. `M3-T2` Build/finish create and edit forms for all six entities.
3. `M3-T3` Add `alias` form fields for universities, majors, and courses.
4. `M3-T4` Add soft-delete action in UI for each entity and wire to corresponding mutation.
5. `M3-T5` Update relation pickers (university, major, course, user) to show only non-deleted options.
6. `M3-T6` Add form validation and server error handling messages for duplicate/invalid input.
7. `M3-T7` Verify contributor dashboard behavior remains scoped and unchanged.
8. `M3-GATE` Admin can manage all in-scope entities end-to-end from dashboard.

## M4 — Public Search Experience

1. `M4-T1` Add shared search query contract (input, debounce timing, empty-query behavior).
2. `M4-T2` Implement universities page search input and result binding.
3. `M4-T3` Implement majors page search scoped to selected university.
4. `M4-T4` Implement courses page search scoped to current major.
5. `M4-T5` Wire all three pages to Convex Search Indexes only.
6. `M4-T6` Ensure empty query falls back to current default list ordering.
7. `M4-T7` Add loading, empty, and no-result states for each search UI.
8. `M4-GATE` Public search returns only scoped, non-deleted, normalized matches.

## M5 — Student Progress and Return Flow

1. `M5-T1` Define Local Storage key strategy for course status and last-major persistence.
2. `M5-T2` Implement status model by `courseId` with enum values `completed`, `in_progress`, `none`.
3. `M5-T3` Add UI controls to set and update course status on course card/page.
4. `M5-T4` Hydrate status from Local Storage on page load and default to `none`.
5. `M5-T5` Persist last visited major on major page entry.
6. `M5-T6` Implement root-path-only redirect check on `/`.
7. `M5-T7` Validate stored last-major target against current non-deleted major/university data before redirect.
8. `M5-GATE` Status persistence and `/` redirect behavior match PRD rules.

## M6 — Analytics Dashboard

1. `M6-T1` Implement admin-only analytics query for total non-deleted universities.
2. `M6-T2` Implement admin-only analytics query for total non-deleted majors.
3. `M6-T3` Implement admin-only analytics query for total non-deleted courses.
4. `M6-T4` Build KPI card UI for the three totals.
5. `M6-T5` Build a single bar chart using those three totals as the only dataset.
6. `M6-T6` Ensure analytics updates reactively with Convex query updates.
7. `M6-GATE` Analytics view is admin-only and numerically correct.

## M7 — Validation, Hardening, and Release

1. `M7-T1` Create PRD acceptance criteria checklist and map each criterion to test coverage.
2. `M7-T2` Run end-to-end validation for admin CRUD, search scope, soft delete, analytics, and local storage flows.
3. `M7-T3` Validate migration behavior on a production-like dataset copy.
4. `M7-T4` Fix defects found in QA and rerun targeted regressions.
5. `M7-T5` Finalize rollout order: schema/indexes, migrations, backend enforcement, UI release.
6. `M7-T6` Prepare post-release monitoring checks for search, mutations, and redirect failures.
7. `M7-T7` Publish release notes for Scope v2 behavior changes.
8. `M7-GATE` All acceptance criteria pass and v2 is release-ready.
