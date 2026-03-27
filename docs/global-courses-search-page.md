# Global Courses Search Page

## Summary

- Add a new public route at /courses for global course search across all universities and majors.
- Keep the page empty by default except for guidance and recent searches; only run course search when there is
  a non-empty query.
- Sync search state to the URL using q, university, and major, and persist recent searches in localStorage so
  they can also be exported/imported from settings.

## Public Interfaces

- New route: /courses
- New URL contract: /courses?q=<text>&university=<universitySlug>&major=<majorSlug>
- New Convex public query in convex/courses.ts:
  - searchGlobalPublic({ query, universitySlug?, majorSlug? })
  - Returns flattened result items with course display data plus majorName, majorSlug, universityName,
    universitySlug, and final href
- New localStorage key for recent course searches:
  - store slug-based entries, not Convex IDs, so backup/restore stays portable
  - dedupe by query + universitySlug + majorSlug, newest first, cap at 8 entries
- LocalDataBackupV1 stays on version 1; this is an additive key only

## Implementation Changes

- Search page:
  - Create app/courses/page.tsx with page metadata and a search surface built for Arabic-first mobile use
  - Use a client search component for query input, cascading filters, recent-search chips, and result
    rendering
  - Validate URL params against current option lists; clear invalid major values and clear major whenever
    university changes
  - Keep URL updates non-urgent with startTransition + router.replace
  - Reuse the existing public-search visual language rather than inventing a new pattern
- Filters and data loading:
  - Fetch universities up front for the filter
  - Load majors only after a university is selected; keep the major filter disabled until then
  - Search results link directly to course pages and show course name, code, major, and university
- Convex:
  - Implement global course search by using the existing course search index first, then joining majors/
    universities and applying optional filters in memory
  - Keep results capped to a reasonable page size and preserve search result ordering after filtering
  - Do not change convex/schema.ts for v1; current search/index shape is sufficient for a query-required
    search page
- Navigation:
  - Add a /courses link to the desktop/tablet header nav in the root layout
  - Add a universal /courses entry inside components/mobile-page-header-menu.tsx so it appears in the mobile
    drawer on public content pages
- Local backup/settings:
  - Add the new recent-search key to the user-data allowlist in lib/local-storage-keys.ts
  - Include it in lib/local-backup.ts
  - Update components/settings/local-data-settings.tsx copy so recent searches are explicitly listed in
    exported/imported local data

## Test Plan

- Route and URL:
  - /courses loads correctly with no query, with q only, and with q + university + major
  - browser back/forward restores the visible search state
  - stale or invalid slugs in the URL are sanitized without breaking the page
- Search behavior:
  - query-only search returns matching courses across universities
  - selecting a university narrows results and available majors
  - changing university clears an incompatible major
  - pressing Enter on a non-empty search saves it
  - entries dedupe correctly and respect the max length
  - clicking a recent-search chip restores query + filters and updates the URL
- Backup/import:
  - exported settings JSON includes recent course searches
  - importing that file on a fresh session restores the recent-search chips
- Verification:
  - npm run lint
  - load /courses in the running Next.js app and confirm no runtime/build errors
  - verify mobile and desktop layouts manually

## Assumptions

- Route path is /courses
- Empty state is “recent searches only”
- URL sync is required
- Major filter is dependent on university selection
- No schema/index migration is planned for v1; if course volume grows enough that search-first-then-filter
  becomes insufficient, denormalizing universityId onto courses can be a later optimization
