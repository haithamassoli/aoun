# Aoun — PRD v3

## Summary

v3 adds a major-scoped news system and browser push notifications to Aoun. Contributors post rich-text news items for their assigned majors. Students browse news on a dedicated page per major and optionally subscribe to push notifications per major. Notifications are powered by the Web Push API (service worker + VAPID keys) with no user account required.

## Goals

- Give contributors a channel to post timely announcements per major.
- Give students a dedicated news page per major with infinite scroll.
- Enable anonymous push notification subscriptions per major.
- Keep existing permission model unchanged.

## Roles

- `admin` — full access, no news CRUD in dashboard for v3.
- `contributor` — post/edit news for assigned majors (same permission model as resources).
- `public student` — browse news, subscribe/unsubscribe to push notifications.

## Scope

### In scope

- New `news` table with rich-text content.
- Contributor dashboard: "News" tab for CRUD on news items within assigned majors.
- Public news page: `/[universitySlug]/[majorSlug]/news` with newest-first infinite scroll.
- Web Push API integration (VAPID keys, service worker).
- New `pushSubscriptions` table mapping push subscription to subscribed major IDs.
- Notification toggle on each major page (disabled by default).
- Push notification on new news: title + deep-link to major news page.
- Soft delete for news (consistent with v2 pattern).

### Out of scope

- Admin dashboard CRUD for news.
- News search/filtering.
- News comments or reactions.
- Email or SMS notifications.
- Rich media attachments (images, files) in news.
- News pinning or priority flags.
- Notification preferences page (manage only via toggle on major page).

## Data Model (Convex Schema)

### news

| Field     | Type           | Notes                              |
| --------- | -------------- | ---------------------------------- |
| _id       | Id             | Convex auto                        |
| majorId   | Id             | FK → majors                        |
| title     | string         | Arabic, required                   |
| content   | string         | HTML string (rich text)            |
| createdBy | Id             | FK → users                         |
| createdAt | number         | Timestamp                          |
| updatedAt | number         | Timestamp                          |
| deletedAt | number (opt)   | Soft delete timestamp              |
| deletedBy | Id (opt)       | FK → users, soft delete actor      |

### pushSubscriptions

| Field        | Type           | Notes                                        |
| ------------ | -------------- | -------------------------------------------- |
| _id          | Id             | Convex auto                                  |
| endpoint     | string         | Push subscription endpoint URL               |
| p256dh       | string         | Client public key                            |
| auth         | string         | Client auth secret                           |
| majorIds     | Id[]           | List of major IDs subscribed to              |
| createdAt    | number         | Timestamp                                    |
| updatedAt    | number         | Timestamp                                    |

## Indexing Requirements (Convex)

- `news` by `majorId` + `createdAt` (descending) for paginated queries, filtered by soft-delete state.
- `pushSubscriptions` by `endpoint` (unique lookup for upsert).
- `pushSubscriptions` by `majorIds` for fan-out on news creation.

## Functional Requirements

### 1) News CRUD (Contributors)

1. Contributors see a "News" tab in their dashboard for each assigned major.
2. Add news: form with title (text input) + content (rich-text editor, same as resource editor).
3. Edit news: same form, pre-filled.
4. Delete news: soft delete (same pattern as v2).
5. All mutations enforce contributor permission checks server-side (same as resources).
6. Admin can post/edit/delete news for any major via direct mutation (no dashboard UI in v3).

### 2) News Page (Public)

1. URL: `/[universitySlug]/[majorSlug]/news`.
2. Accessible via a button/link on the major page.
3. Displays news items newest-first.
4. Infinite scroll pagination using Convex paginated queries.
5. Each news item shows: title, content (rendered HTML), date, author name.
6. Soft-deleted news items are excluded.
7. Empty state: message indicating no news yet.
8. SSR for SEO. Dynamic `<title>` and `<meta>` tags.

### 3) Push Notification Subscription

1. Major page shows a notification toggle (bell icon or similar).
2. Default state: off (unsubscribed).
3. When student enables notifications for a major:
   - Browser prompts for notification permission (if not already granted).
   - If granted, register service worker and get push subscription.
   - Send subscription + majorId to backend.
   - Backend upserts `pushSubscriptions` record: if endpoint exists, add majorId to `majorIds` array; otherwise create new record.
4. When student disables notifications for a major:
   - Send unsubscribe request with subscription endpoint + majorId.
   - Backend removes majorId from `majorIds` array.
   - If `majorIds` is empty, delete the subscription record.
5. Toggle state is derived from checking if the current browser's push subscription endpoint exists in the database with the current majorId.

### 4) Push Notification Dispatch

1. When a contributor creates a new news item, trigger notification dispatch.
2. Query `pushSubscriptions` where `majorIds` contains the news item's `majorId`.
3. For each matching subscription, send a push notification via Web Push protocol.
4. Notification payload:
   - `title`: news item title.
   - `body`: "اضغط لعرض الأخبار" (Click to view news).
   - `url`: `/{universitySlug}/{majorSlug}/news` (deep-link).
5. Handle expired/invalid subscriptions: if push delivery returns 410 (Gone), delete the subscription record.
6. Dispatch runs as a Convex action (not mutation) since it makes external HTTP calls.

### 5) Service Worker

1. Register a service worker at `/sw.js`.
2. Service worker handles:
   - `push` event: show notification with title, body, and icon.
   - `notificationclick` event: open or focus the deep-link URL.
3. Service worker is registered on first visit to any major page (lazy registration).

## API Design

### Mutations

- `news.create({ majorId, title, content })` — creates news item, triggers notification action.
- `news.update({ newsId, title, content })` — updates news item.
- `news.remove({ newsId })` — soft deletes news item.

### Queries

- `news.listByMajor({ majorId, paginationOpts })` — paginated, newest-first, excludes soft-deleted.

### Actions

- `pushSubscriptions.subscribe({ endpoint, p256dh, auth, majorId })` — upsert subscription.
- `pushSubscriptions.unsubscribe({ endpoint, majorId })` — remove major from subscription.
- `notifications.send({ newsId })` — fan-out push notifications for a news item.

### Queries

- `pushSubscriptions.getByEndpoint({ endpoint })` — check subscription state for toggle UI.

## Environment Variables

- `VAPID_PUBLIC_KEY` — public VAPID key (exposed to client).
- `VAPID_PRIVATE_KEY` — private VAPID key (server-side only, Convex env).
- `VAPID_SUBJECT` — mailto or URL for VAPID identification.

## UI Requirements

### Major Page

- Add a "News" button/link that navigates to the news page.
- Add a notification toggle (bell icon) with visual state (on/off).
- Toggle shows loading state during subscription/unsubscription.

### News Page

- Header with major name + "الأخبار" (News).
- List of news cards: title, rendered HTML content, formatted date, author name.
- Infinite scroll trigger at bottom of list.
- Back navigation to major page.
- Breadcrumb: University → Major → News.

### Contributor Dashboard

- "News" tab alongside existing content management.
- News list for assigned major with add/edit/delete actions.
- News form: title input + rich-text editor (reuse existing Tiptap setup).

## SEO

- News page is SSR with proper `<title>`: `أخبار {majorName} - {universityName} | عون`.
- Open Graph tags for social sharing.
- Add news page to sitemap generation.

## Acceptance Criteria

1. Contributor can create, edit, and soft-delete news items for assigned majors.
2. Permission checks prevent contributors from posting to unassigned majors.
3. News page displays items newest-first with working infinite scroll.
4. Soft-deleted news never appears on public pages.
5. Notification toggle correctly subscribes/unsubscribes the browser for a specific major.
6. Browser notification permission is requested only when student enables notifications.
7. Push notification is received when a contributor posts new news to a subscribed major.
8. Clicking the notification opens the correct major news page.
9. Expired subscriptions (410 Gone) are cleaned up automatically.
10. Service worker is registered and handles push + click events correctly.
11. Toggle state persists across page reloads (derived from subscription lookup).
12. Notifications are disabled by default for all majors.

## Migration Notes

- Generate VAPID key pair and store in Convex environment variables.
- Deploy service worker to `/public/sw.js`.
- No data migration needed — new tables only.
