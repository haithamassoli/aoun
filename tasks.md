# Aoun — Project Milestones & Tasks

## Milestone 1: Project Foundation & Data Layer

Set up the core infrastructure: Convex schema, database indexes, seed data utilities, and base Next.js configuration (RTL, Arabic font, Tailwind). By the end, `npx convex dev` runs with all tables defined and the app renders a styled RTL shell.

### Tasks

- [x] 1.1 — Initialize Convex in the project (`npx convex init`), connect to a Convex dev deployment, and verify `npx convex dev` runs successfully.
- [x] 1.2 — Define the Convex schema (`convex/schema.ts`) with all 6 tables: `universities`, `majors`, `courses`, `resources`, `users`, `permissions`. Include all fields, types, and validators as specified in the PRD.
- [x] 1.3 — Add database indexes: `resources` by `courseId`, `courses` by `majorId`, `majors` by `universityId`, `permissions` by `userId`, `users` by `email`, `universities` by `slug`, `majors` by `slug`, `courses` by `slug`.
- [x] 1.4 — Configure the Next.js root layout for RTL: set `dir="rtl"` and `lang="ar"` on `<html>`, load IBM Plex Arabic via `next/font`, and apply it globally.
- [x] 1.5 — Set up Tailwind CSS with RTL support using logical properties (`ms-`, `me-`, `ps-`, `pe-`) or the RTL plugin. Verify utility classes render correctly in RTL.
- [x] 1.6 — Create a base app shell layout: header with site name, main content area, and footer. All text in Arabic. Ensure the shell is responsive and mobile-first.
- [x] 1.7 — Set up the Convex client provider in the Next.js app so both server and client components can call Convex queries/mutations.
- [x] 1.8 — Write basic Convex query functions for each table (e.g., `listUniversities`, `getUniversityBySlug`) to validate the schema is correctly deployed and queryable.

---

## Milestone 2: Public Browsing Pages (SSR + SEO)

Build the four public pages — Home, University, Major, Course — as server-rendered Next.js routes with dynamic metadata, breadcrumbs, and proper semantic HTML. All reads go through Convex queries. Pages are responsive and mobile-first.

### Tasks

- [x] 2.1 — Build the **Home page** (`/`): hero section with Arabic text explaining Aoun, grid of 4 university cards (logo, name). Each card links to `/[universitySlug]`. Use semantic HTML (`<main>`, `<h1>`).
- [x] 2.2 — Build the **University page** (`/[universitySlug]`): fetch university by slug, display list of majors as cards/links. Handle 404 if slug not found. Use `<h1>` for university name.
- [x] 2.3 — Build the **Major page** (`/[universitySlug]/[majorSlug]`): fetch major by slug within university, display study plan view with courses grouped by semester/year. Each course is a clickable card showing name and course code. Handle 404.
- [x] 2.4 — Build the **Course page** (`/[universitySlug]/[majorSlug]/[courseSlug]`): fetch course by slug within major, display resources organized by category (notes, exams, videos, summaries, tips, other) as tabs or sections. Link resources open in new tab. Rich-text resources render inline. Hide empty categories. Handle 404.
- [x] 2.5 — Write all required Convex query functions for public pages: `getUniversityBySlug`, `getMajorsByUniversity`, `getMajorBySlug`, `getCoursesByMajor`, `getCourseBySlug`, `getResourcesByCourse`.
- [x] 2.6 — Add dynamic `<title>` and `<meta description>` in Arabic for each page using Next.js `generateMetadata`. Include course name + university name where applicable.
- [x] 2.7 — Implement a breadcrumb component (University > Major > Course) on University, Major, and Course pages. Use semantic `<nav>` with structured data for Google.
- [x] 2.8 — Ensure all pages are fully responsive: mobile-first layout, cards stack vertically on small screens, proper spacing and font sizes for all breakpoints.

---

## Milestone 3: Authentication System

Implement email + password login with hashed credentials, session management, and Convex server-side auth validation. Build the `/login` page. No public registration — accounts are created by the admin directly in the database for now.

### Tasks

- [x] 3.1 — Implement password hashing utilities in Convex (use `bcrypt` or equivalent). Create a Convex mutation to seed an initial admin user with a hashed password.
- [x] 3.2 — Create a Convex `login` mutation: accepts email + password, verifies credentials against the `users` table, returns a session token (JWT or Convex-native auth token).
- [x] 3.3 — Implement session management: store session tokens, validate them on subsequent requests, and handle expiration. Use Convex auth or a custom session table.
- [x] 3.4 — Build the `/login` page: Arabic form with email and password fields, submit button, error messages for invalid credentials. RTL-styled, mobile-friendly.
- [x] 3.5 — Create a `getCurrentUser` Convex query that resolves the authenticated user from the session token. Returns `null` if not authenticated.
- [x] 3.6 — Add auth context/provider on the client side so components can access the current user and auth state (logged in/out).
- [x] 3.7 — Implement logout functionality: clear session token on client, invalidate server-side if applicable.
- [x] 3.8 — Protect dashboard routes with middleware or layout-level auth checks — redirect unauthenticated users to `/login`.

---

## Milestone 4: Authorization & Permission Enforcement

Build the permission model: `getPermissions` helper, role checks on every mutation, major-scoped access for contributors. Admin bypasses all checks. Every write path is gated server-side in Convex.

### Tasks

- [x] 4.1 — Implement a `getPermissions(userId)` helper in Convex that returns the list of `majorId`s a contributor is allowed to manage. Admin role returns a flag indicating full access.
- [x] 4.2 — Create an `assertCanEditMajor(userId, majorId)` helper that throws if the user is not an admin and doesn't have a permission record for that major.
- [x] 4.3 — Create an `assertCanEditCourse(userId, courseId)` helper that resolves the course's `majorId` and delegates to `assertCanEditMajor`.
- [x] 4.4 — Create an `assertCanEditResource(userId, courseId)` helper that follows the same chain: resource → course → major → permission check.
- [x] 4.5 — Add auth + permission checks to all existing and future Convex mutations: `addResource`, `updateResource`, `deleteResource`, `addCourse`, `updateCourse`. Each mutation must call the appropriate assertion helper before writing.
- [x] 4.6 — Restrict admin-only mutations: `addUniversity`, `updateUniversity`, `addMajor`, `updateMajor`, `deleteAny`, `manageUsers`, `managePermissions`. These must assert `role === "admin"`.
- [x] 4.7 — Write unit tests or manual test scripts to verify: contributor can edit resources in assigned major, contributor is blocked from editing other majors, admin can edit everything, unauthenticated requests are rejected.

---

## Milestone 5: Contributor Dashboard & Resource Editor

Create the `/dashboard` route. Contributors see their assigned majors, courses, and resources with add/edit capabilities. Build the resource editor form (title, category, type toggle, URL input or Tiptap rich-text editor). HTML content is sanitized before storage and rendering.

### Tasks

- [ ] 5.1 — Build the `/dashboard` layout: sidebar or tab navigation showing the user's assigned majors (contributors) or all entities (admin). Arabic UI, RTL, responsive.
- [ ] 5.2 — Build the **major list view** in the dashboard: contributors see only their permitted majors, admin sees all. Each major links to its course management view.
- [ ] 5.3 — Build the **course management view**: list courses under a major with add/edit/reorder capabilities. Form fields: name, slug, courseCode, semester, order.
- [ ] 5.4 — Build the **resource list view** for a course: display resources grouped by category, with add/edit/delete buttons. Show title, type badge (link/richtext), and category.
- [ ] 5.5 — Build the **resource editor form**: title input, category dropdown (notes, exams, videos, summaries, tips, other), type toggle (link vs rich text). If link: URL input. If rich text: Tiptap editor.
- [ ] 5.6 — Integrate Tiptap rich-text editor with RTL support. Configure basic formatting toolbar (bold, italic, headings, lists, links). Ensure output is clean HTML.
- [ ] 5.7 — Implement HTML sanitization using DOMPurify: sanitize on the server before storing in Convex, and sanitize again before rendering with `dangerouslySetInnerHTML` on public pages.
- [ ] 5.8 — Write Convex mutations for resource CRUD: `addResource`, `updateResource`, `deleteResource`. All enforce auth + permission checks from Milestone 4.
- [ ] 5.9 — Write Convex mutations for course CRUD: `addCourse`, `updateCourse`. Enforce permission checks.
- [ ] 5.10 — Add loading states, success/error toasts, and form validation to all dashboard forms. Validate required fields, URL format, and slug uniqueness.

---

## Milestone 6: SEO, Sitemap & Production Hardening

Generate `sitemap.xml` from Convex data, add Open Graph tags, structured breadcrumbs for Google, and validate all meta tags. Audit performance, accessibility, and security.

### Tasks

- [ ] 6.1 — Generate a dynamic `sitemap.xml` route (`/sitemap.xml`) that fetches all universities, majors, and courses from Convex and outputs valid sitemap XML with all public URLs.
- [ ] 6.2 — Add Open Graph meta tags (`og:title`, `og:description`, `og:url`, `og:type`, `og:image`) to all public pages for proper social media sharing.
- [ ] 6.3 — Add structured data (JSON-LD) for breadcrumbs on University, Major, and Course pages so Google renders breadcrumb trails in search results.
- [ ] 6.4 — Audit and verify all `<title>` and `<meta description>` tags are unique, descriptive, and in Arabic for every public route.
- [ ] 6.5 — Performance audit: test all pages with Lighthouse targeting < 2s load on simulated 3G. Optimize images (logos), minimize client JS, verify SSR is working correctly.
- [ ] 6.6 — Accessibility audit: verify proper heading hierarchy (`h1` → `h2` → `h3`), color contrast ratios meet WCAG AA, all interactive elements are keyboard-navigable, and focus states are visible.
- [ ] 6.7 — Security audit: verify all Convex mutations enforce auth, HTML content is sanitized with DOMPurify before rendering, no XSS vectors exist in rich-text output, and no sensitive data leaks in client bundles.
- [ ] 6.8 — Add a custom 404 page in Arabic for unmatched routes. Ensure slug-based 404s (invalid university/major/course) show a friendly Arabic error message.

---

## Milestone 7: Seed Data & Launch

Populate the 4 universities, their majors, study plans, and initial course entries. Onboard first contributor accounts. Final QA pass, deploy to production.

### Tasks

- [ ] 7.1 — Create a Convex seed script that populates the 4 universities with Arabic names, slugs, logos, and display order.
- [ ] 7.2 — Populate majors for each university with Arabic names, slugs, and display order. Coordinate with real university data for accuracy.
- [ ] 7.3 — Populate courses for each major: Arabic names, slugs, course codes, semester assignments, and display order. Follow actual study plans.
- [ ] 7.4 — Create the initial admin account via the seed script with a secure hashed password.
- [ ] 7.5 — Create initial contributor accounts and assign major permissions via seed script or direct database operations.
- [ ] 7.6 — End-to-end QA: walk through every public page (Home → University → Major → Course) and verify content renders correctly, links work, RTL is consistent, and no layout issues exist on mobile and desktop.
- [ ] 7.7 — End-to-end QA: log in as contributor, add a resource (link and rich text), verify it appears on the public course page. Log in as admin, verify full access.
- [ ] 7.8 — Deploy Next.js to Vercel: configure environment variables (Convex deployment URL), verify SSR works in production, test all routes.
- [ ] 7.9 — Deploy Convex to production: push schema and functions, verify production queries return correct data, confirm real-time updates work.
- [ ] 7.10 — Final smoke test on production: verify sitemap, OG tags, login flow, resource creation, and page load performance.
