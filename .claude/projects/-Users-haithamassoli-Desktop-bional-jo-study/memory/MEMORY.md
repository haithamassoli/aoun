# Jo-Study (Aoun) Project Memory

## Stack

- Next.js 16, React 19, Tailwind 4, Convex backend
- Auth: custom session-based (no third-party)
- Forms: @tanstack/react-form
- Tables: @tanstack/react-table
- Rich text: tiptap

## Key Paths

- `convex/schema.ts` - Convex schema
- `convex/helpers.ts` - Auth + RBAC helpers (authenticateUser, assertAdmin, assertCanEditMajor, etc.)
- `convex/searchUtils.ts` - Normalization + buildSearchToken helpers (v2)
- `convex/migrations.ts` - v2 backfill migrations (internal mutations)
- `docs/v2/PRD.md` - v2 PRD
- `docs/v2/tasks.md` - v2 task breakdown

## Architecture

- Entities: universities, majors, courses, resources, users, permissions, sessions
- Roles: admin (full access), contributor (scoped to assigned majors)
- All entities use token-based auth via `authenticateUser(ctx, token)`

## v2 Progress

- M1-T1: DONE - Soft-delete fields (deletedAt, deletedBy) added to all entities
- M1-T2: DONE - alias + searchToken fields added to universities, majors, courses
- M1-T3: DONE - Shared normalization utility in convex/searchUtils.ts
- M1-T4: DONE - buildSearchToken helpers per entity shape
- M1-T5: DONE - Search indexes added (search_token) with filterFields
- M1-T6: DONE - Relation indexes confirmed (by_universityId, by_majorId, etc.)
- M1-T7: DONE - Migration/backfill script in convex/migrations.ts
- M1-T8: DONE - Need to deploy schema and run migrations
- M1-T10: DONE - Migration docs
- M2-T1: DONE - RBAC helpers updated (filter soft-deleted perms, reject deleted users)
- M2-T2: DONE - Admin full CRUD already worked; added searchToken computation on create/update
- M2-T3: DONE - Contributor restrictions unchanged (assertCanEditMajor/Course/Resource)
- M2-T4: DONE - All delete mutations now soft-delete (patch deletedAt/deletedBy)
- M2-T5: DONE - All read queries filter non-deleted (isNotDeleted helper)
- M2-T6: DONE - Uniqueness checks use .collect() + isNotDeleted filter
- M2-T7: DONE - Relation lookups (assertCanEditCourse/Resource, getPermissions) exclude deleted
- M3-T1: DONE - Admin list pages for all 6 entities (app/dashboard/admin/{universities,majors,courses,resources,users})
- M3-T2: DONE - Create/edit forms for all 6 entities with inline form pattern
- M3-T3: DONE - Alias fields added to university, major, course forms (admin + contributor)
- M3-T4: DONE - Soft-delete action wired in UI for all entities
- M3-T5: DONE - Relation pickers (university, major, course, user) show only non-deleted options
- M3-T6: DONE - Form validation + server error messages for duplicates (slug, email, permission)
- M3-T7: DONE - Contributor dashboard unchanged; alias field added to contributor course form
