# v2 Migration Guide

## Prerequisites
- Convex CLI installed and authenticated
- Access to the target deployment (dev or prod)

## Run Order

### Step 1: Deploy Schema
Deploy the updated schema first so Convex accepts the new fields and indexes.

```bash
npx convex dev   # for dev
npx convex deploy # for prod (only when ready)
```

### Step 2: Run Backfill Migrations
Run each migration in order via the Convex dashboard or CLI.
Each returns the count of updated documents.

```bash
# 1. Universities - backfills alias, searchToken, soft-delete nulls
npx convex run --component migrations:backfillUniversities

# 2. Majors
npx convex run --component migrations:backfillMajors

# 3. Courses
npx convex run --component migrations:backfillCourses

# 4. Resources (soft-delete fields only)
npx convex run --component migrations:backfillResources

# 5. Users (soft-delete fields only)
npx convex run --component migrations:backfillUsers

# 6. Permissions (soft-delete fields only)
npx convex run --component migrations:backfillPermissions
```

### Step 3: Verify
- Check document counts before/after are stable (no rows lost)
- Verify all universities/majors/courses have valid `searchToken` values
- Verify search indexes are built and queryable

## What the Migration Does
- `alias`: Set to empty string `""` where missing
- `searchToken`: Generated from name + slug + alias (+ courseCode for courses) using Arabic/English normalization
- `deletedAt` / `deletedBy`: Left as `undefined` (optional fields, no change needed)

## Rollback
These migrations are additive (new optional fields). To rollback:
1. Revert schema.ts to v1 version
2. Re-deploy schema
3. New fields will be ignored by v1 code (they're optional)
4. Search indexes will be dropped automatically when removed from schema

No data loss occurs during rollback since no existing fields are modified.
