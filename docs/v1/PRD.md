# Aoun — PRD

## Summary

Aoun is a free, volunteer-driven Arabic platform that aggregates academic resources (summaries, exams, tutorials, study plans) for Jordanian university students. Contributors post categorized links and rich-text content per course. An admin (you) controls who can publish and to which majors.

**Stack:** Next.js (App Router, SSR) · Convex · Tailwind CSS  
**Language:** Arabic-only, full RTL  
**Launch scope:** 4 universities, expandable

---

## Problem

Jordanian university students rely on scattered Telegram groups, Google Drive folders, and word-of-mouth to find course materials. There is no single, browsable, structured source of truth per course. Students waste time searching; good resources get lost in chat history.

## Target Users

- **Students** — browse and consume resources.
- **Contributors** — trusted students who publish content for assigned majors.
- **Admin (you)** — manage contributors, assign permissions, oversee all content. for now the admin manage from the database.

---

## Information Architecture

```
Home
└── University (e.g., University of Jordan)
    └── Major (e.g., Electrical Engineering)
        ├── Study Plan (official course list)
        └── Course (e.g., Circuit Analysis 1)
            ├── Resources (links: Drive, YouTube, etc.)
            └── Content blocks (rich text: summaries, tips)
```

### URL Structure (SEO)

```
/                                  → Home (university list)
/[universitySlug]                  → University page (major list)
/[universitySlug]/[majorSlug]      → Major page (study plan + course list)
/[universitySlug]/[majorSlug]/[courseSlug]  → Course page (resources)
```

All slugs are transliterated Arabic or use short IDs. SSR on all pages.

---

## Data Model (Convex Schema)

### universities

| Field   | Type   | Notes            |
| ------- | ------ | ---------------- |
| \_id    | Id     | Convex auto      |
| name    | string | Arabic name      |
| slug    | string | URL-safe, unique |
| logoUrl | string | Optional         |
| order   | number | Display sort     |

### majors

| Field        | Type   | Notes                    |
| ------------ | ------ | ------------------------ |
| \_id         | Id     | Convex auto              |
| universityId | Id     | FK → universities        |
| name         | string | Arabic name              |
| slug         | string | Unique within university |
| order        | number | Display sort             |

### courses

| Field      | Type   | Notes                          |
| ---------- | ------ | ------------------------------ |
| \_id       | Id     | Convex auto                    |
| majorId    | Id     | FK → majors                    |
| name       | string | Arabic name                    |
| slug       | string | Unique within major            |
| courseCode | string | Optional (e.g., "EE301")       |
| semester   | number | Optional (study plan year/sem) |
| order      | number | Display sort within semester   |

### resources

| Field     | Type   | Notes                                                    |
| --------- | ------ | -------------------------------------------------------- |
| \_id      | Id     | Convex auto                                              |
| courseId  | Id     | FK → courses                                             |
| type      | string | "link" or "richtext"                                     |
| category  | string | "notes", "exams", "videos", "summaries", "tips", "other" |
| title     | string | Arabic                                                   |
| url       | string | Required if type="link"                                  |
| content   | string | HTML string if type="richtext"                           |
| order     | number | Display sort within category                             |
| createdBy | Id     | FK → users                                               |
| createdAt | number | Timestamp                                                |
| updatedAt | number | Timestamp                                                |

### users

| Field        | Type   | Notes                    |
| ------------ | ------ | ------------------------ |
| \_id         | Id     | Convex auto              |
| name         | string |                          |
| email        | string | Unique, used for login   |
| role         | string | "admin" or "contributor" |
| passwordHash | string | Hashed                   |

### permissions

| Field   | Type | Notes       |
| ------- | ---- | ----------- |
| \_id    | Id   | Convex auto |
| userId  | Id   | FK → users  |
| majorId | Id   | FK → majors |

A contributor can publish/edit resources **only** for courses under majors they have a permission record for. Admin bypasses all checks.

---

## Roles & Access Control

| Action                     | Admin | Contributor (assigned major) | Public |
| -------------------------- | ----- | ---------------------------- | ------ |
| Browse all content         | ✓     | ✓                            | ✓      |
| Add/edit resources         | ✓     | ✓ (own majors only)          | ✗      |
| Add/edit courses           | ✓     | ✓ (own majors only)          | ✗      |
| Add/edit majors            | ✓     | ✗                            | ✗      |
| Add/edit universities      | ✓     | ✗                            | ✗      |
| Manage users & permissions | ✓     | ✗                            | ✗      |
| Delete any resource        | ✓     | ✗                            | ✗      |

### Auth Flow

- Simple email + password login (no public registration).
- Admin creates contributor accounts and assigns major permissions via a dashboard.
- Convex server-side functions enforce permission checks on every mutation.

---

## Pages & Components

### Public Pages

1. **Home `/`**  
   Grid of 4 university cards (logo, name). Simple hero text explaining Aoun.

2. **University `/[universitySlug]`**  
   List of majors as cards/links, grouped or alphabetical.

3. **Major `/[universitySlug]/[majorSlug]`**
   - Study plan view: courses grouped by semester/year.
   - Each course is a clickable card showing name and code.

4. **Course `/[universitySlug]/[majorSlug]/[courseSlug]`**
   - Tabs or sections by category (notes, exams, videos, summaries, tips, other).
   - Each resource: title + external link (opens new tab) or inline rich text block.
   - Empty categories are hidden.

### Admin/Contributor Pages (behind auth)

5. **Login `/login`**

6. **Dashboard `/dashboard`**
   - Admin: full management UI (universities, majors, courses, resources, users, permissions).
   - Contributor: filtered view showing only their assigned majors → courses → resources with add/edit capabilities.

7. **Resource Editor**
   - Form: title, category (dropdown), type toggle (link vs rich text).
   - If link: URL input.
   - If rich text: lightweight HTML editor (e.g., Tiptap or similar).

---

## SEO & SSR Strategy

- All public pages use Next.js App Router server components with SSR.
- Dynamic `<title>` and `<meta description>` in Arabic per page (e.g., course name + university name).
- Structured breadcrumbs for Google: University → Major → Course.
- `sitemap.xml` generated from Convex data at build or on-demand.
- Open Graph tags for social sharing.
- Semantic HTML: `<h1>`, `<nav>`, `<main>`, `<article>`.

---

## RTL & Arabic UI

- `dir="rtl"` and `lang="ar"` on `<html>`.
- Tailwind RTL plugin or logical properties (`ms-`, `me-`, `ps-`, `pe-`).
- All UI labels, navigation, and placeholder text in Arabic.
- Font: IBM Plex Arabic.

---

## MVP Scope

### In Scope (v1)

- 4 universities, their majors, study plans, courses.
- Link and rich-text resources with categories.
- Contributor accounts with major-scoped permissions.
- SSR, SEO, sitemap.
- Responsive mobile-first design.

### Out of Scope (future)

- Admin dashboard: full CRUD for all entities.
- Public registration or student accounts.
- Comments, ratings, or social features.
- File uploads (PDFs, images hosted on platform).
- Search (can add later with Convex full-text search).
- Analytics dashboard.
- Notifications for new content.
- Multi-language support.
- University-specific branding/theming.

---

## Non-Functional Requirements

- **Performance:** Pages should load under 2s on 3G. SSR + minimal client JS.
- **Security:** All mutations validate auth + permissions server-side in Convex. Sanitize HTML content to prevent XSS.
- **Scalability:** Convex handles scaling. Schema supports adding universities without schema changes.
- **Accessibility:** Proper heading hierarchy, contrast ratios, keyboard navigation.

---

## Technical Notes

### Convex Specifics

- Use Convex `query` for all public reads (cached, real-time).
- Use Convex `mutation` for all writes with auth checks.
- Define a `getPermissions` helper that resolves user → allowed majorIds, reused across mutations.
- Indexes: `resources` by `courseId`, `courses` by `majorId`, `majors` by `universityId`, `permissions` by `userId`.

### Rich Text

- Store HTML as a string field in Convex.
- Render with `dangerouslySetInnerHTML` after sanitization (DOMPurify on server).
- Editor: Tiptap (lightweight, extensible, good RTL support).

### Deployment

- Next.js on Vercel (free tier sufficient for volunteer project).
- Convex cloud (free tier covers low-moderate usage).
