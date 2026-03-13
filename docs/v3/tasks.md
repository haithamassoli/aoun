# Aoun v3 — Milestones & Tasks

## M1: Data Layer & Backend Foundation

Schema, indexes, and server-side functions for the news system. No UI. Everything is testable via Convex dashboard.

**Done when:** A contributor can create/edit/soft-delete news via Convex dashboard. Paginated query returns correct results filtered by majorId and soft-delete state.

### Tasks

- [x] **M1-T1: Add `news` table to schema**
  Add `news` table in `convex/schema.ts` with fields: `majorId` (Id → majors), `title` (string), `content` (string, HTML), `createdBy` (Id → users), `createdAt` (number), `updatedAt` (number), `deletedAt` (optional number), `deletedBy` (optional Id → users). Add index `by_majorId` on `[majorId, createdAt]` for paginated queries.

- [x] **M1-T2: Add `pushSubscriptions` table to schema**
  Add `pushSubscriptions` table in `convex/schema.ts` with fields: `endpoint` (string), `p256dh` (string), `auth` (string), `majorIds` (array of Id → majors), `createdAt` (number), `updatedAt` (number). Add index `by_endpoint` on `[endpoint]` for upsert lookups.

- [x] **M1-T3: Create `convex/news.ts` — `add` mutation**
  Create `news.add({ token, majorId, title, content })` mutation. Authenticate user via `authenticateUser()`. Check permission via `assertCanEditMajor()`. Validate title is non-empty. Sanitize HTML content with `sanitizeRichText()`. Insert into `news` table with `createdAt`, `updatedAt` set to `Date.now()`, `createdBy` set to authenticated user.

- [x] **M1-T4: Create `news.update` mutation**
  Create `news.update({ token, newsId, title, content })` mutation. Authenticate user. Fetch news doc, assert not deleted. Resolve majorId from news doc, check permission via `assertCanEditMajor()`. Sanitize content. Patch `title`, `content`, `updatedAt`.

- [x] **M1-T5: Create `news.remove` mutation**
  Create `news.remove({ token, newsId })` mutation. Authenticate user. Fetch news doc, assert not deleted. Resolve majorId, check permission via `assertCanEditMajor()`. Apply soft delete: set `deletedAt = Date.now()`, `deletedBy = userId`.

- [x] **M1-T6: Create `news.listByMajor` query (paginated)**
  Create `news.listByMajor({ majorId, paginationOpts })` paginated query. Query `news` table using `by_majorId` index filtered by `majorId`. Filter out soft-deleted items (`deletedAt` is undefined). Order by `createdAt` descending (newest first). Return paginated results.

- [x] **M1-T7: Create `pushSubscriptions.subscribe` mutation**
  Create `pushSubscriptions.subscribe({ endpoint, p256dh, auth, majorId })` mutation (no auth required — public students). Query `by_endpoint` index. If subscription exists, add `majorId` to `majorIds` array (if not already present), update `updatedAt`. If not exists, insert new record with `majorIds: [majorId]`, `createdAt`, `updatedAt`.

- [x] **M1-T8: Create `pushSubscriptions.unsubscribe` mutation**
  Create `pushSubscriptions.unsubscribe({ endpoint, majorId })` mutation. Query `by_endpoint` index. If found, remove `majorId` from `majorIds`. If `majorIds` is now empty, hard-delete the subscription record. Otherwise patch with updated `majorIds` and `updatedAt`.

- [x] **M1-T9: Create `pushSubscriptions.getByEndpoint` query**
  Create `pushSubscriptions.getByEndpoint({ endpoint })` query. Return the subscription doc (or null) for the given endpoint. Used by frontend to derive toggle state per major.

---

## M2: Contributor Dashboard — News Tab

Dashboard UI for contributors to manage news items within their assigned majors.

**Done when:** A contributor can manage news items end-to-end from the dashboard for their assigned majors only.

### Tasks

- [x] **M2-T1: Add "News" tab to contributor major dashboard**
  In `app/dashboard/major/[majorId]/page.tsx`, add a "الأخبار" (News) tab alongside the existing courses section. Use the same tab/navigation pattern already in the dashboard. When active, render the news management component.

- [x] **M2-T2: Create news list component for dashboard**
  Create a `components/dashboard/news-list.tsx` component. Fetch news via `news.listByMajor` query with the current `majorId`. Display a table or card list with columns: title, date (formatted), actions (edit, delete). Include empty state. Use the same patterns as the existing resources list (motion animations, staggered entrance).

- [x] **M2-T3: Create news form component (add/edit)**
  Create a `components/dashboard/news-form.tsx` component using `@tanstack/react-form` with Zod validation. Fields: title (text input, required, Arabic label), content (Tiptap editor, reuse existing `TiptapEditor` component). On submit, call `news.add` or `news.update` mutation with session token. Show toast on success/error. Reset form after successful add.

- [x] **M2-T4: Wire up soft-delete action for news**
  Add delete button to each news item in the list. On click, show confirmation dialog (same pattern as resource delete). Call `news.remove` mutation. Show success toast. List auto-refreshes via Convex reactivity.

- [x] **M2-T5: Add news count indicator**
  Show news count badge on the "News" tab label so contributors can see at a glance how many news items exist for the major. Query count from `news.listByMajor`.

---

## M3: Public News Page

Student-facing news page with SSR and infinite scroll.

**Done when:** Students can navigate to the news page from any major and scroll through all news items. Page is SSR-rendered with correct metadata.

### Tasks

- [x] **M3-T1: Create news page route**
  Create `app/[universitySlug]/[majorSlug]/news/page.tsx`. Server component using `fetchQuery` to get initial news data and major/university info. Call `notFound()` if university or major doesn't exist or is deleted. Pass initial data to client component.

- [x] **M3-T2: Implement `generateMetadata` for news page**
  Add `generateMetadata()` in the news page. Set `<title>` to `أخبار {majorName} - {universityName} | عون`. Add description, Open Graph tags (`og:title`, `og:description`, `og:url`). Follow same pattern as existing major page metadata.

- [x] **M3-T3: Create news page client component with infinite scroll**
  Create `components/news-page-content.tsx` client component. Use Convex `usePaginatedQuery` for `news.listByMajor` with the majorId. Render news cards newest-first. Implement infinite scroll with intersection observer trigger at bottom. Show loading spinner during fetch. Show empty state ("لا توجد أخبار حالياً") when no news.

- [x] **M3-T4: Create news card component**
  Create `components/news-card.tsx`. Display: title (h2), rendered HTML content (sanitized, `dangerouslySetInnerHTML`), formatted date (Arabic locale), author name. Use prose styling for HTML content. RTL layout. Match existing card design patterns (rounded corners, shadow, padding).

- [x] **M3-T5: Add "News" button to major page**
  On the major page (`app/[universitySlug]/[majorSlug]/page.tsx`), add a button/link labeled "الأخبار" that navigates to `/{universitySlug}/{majorSlug}/news`. Place it in the hero section or alongside quick links. Use `next/link` for client-side navigation.

- [x] **M3-T6: Add breadcrumb navigation to news page**
  Add breadcrumbs: الرئيسية → {universityName} → {majorName} → الأخبار. Follow same breadcrumb component pattern used on major and course pages.

- [x] **M3-T7: Add news page to sitemap**
  Update `convex/sitemap.ts` to include `/{universitySlug}/{majorSlug}/news` paths for all non-deleted majors. Update `app/sitemap.ts` to handle the new paths with appropriate `changeFrequency` ("daily") and `priority` (0.6).

- [x] **M3-T8: Create `news.getLatestByMajor` query**
  Create a non-paginated query that returns the latest news item (or null) for a given majorId. Used by the major page to show a "new news" indicator or preview snippet next to the news button.

---

## M4: Web Push Infrastructure

Service worker, VAPID setup, and subscription management backend. No UI toggle yet.

**Done when:** A browser can programmatically subscribe/unsubscribe, and subscription records are correctly stored and managed in Convex.

### Tasks

- [x] **M4-T1: Generate VAPID keys and configure environment**
  Generate VAPID key pair using `web-push` library. Store `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (mailto:admin email) in Convex environment variables. Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to Next.js env for client access.

- [x] **M4-T2: Install `web-push` dependency**
  Install `web-push` npm package (used server-side in Convex actions for sending push notifications). Add to project dependencies.

- [x] **M4-T3: Update service worker with push handlers**
  Update `/public/sw.js` to handle `push` event: parse notification payload (title, body, url), call `self.registration.showNotification()` with title, body, icon (app icon), and data (url). Handle `notificationclick` event: close notification, call `clients.openWindow(event.notification.data.url)` to deep-link.

- [x] **M4-T4: Create push subscription utility**
  Create `lib/push-subscription.ts` with helper functions: `subscribeToPush()` — registers service worker, calls `registration.pushManager.subscribe()` with VAPID public key (urlBase64ToUint8Array conversion), returns `PushSubscription`. `getExistingSubscription()` — gets current subscription from service worker if any. `unsubscribeFromPush()` — calls `subscription.unsubscribe()`.

- [x] **M4-T5: Create `usePushSubscription` hook**
  Create `hooks/use-push-subscription.ts`. On mount, check if push is supported (`'PushManager' in window`). Get existing subscription via service worker. Expose: `isSupported`, `subscription` (current PushSubscription or null), `subscribe(majorId)`, `unsubscribe(majorId)`, `isSubscribedToMajor(majorId)` (derived from `pushSubscriptions.getByEndpoint` query).

---

## M5: Notification Toggle & Dispatch

Connect the push infrastructure to the UI and trigger notifications on news creation.

**Done when:** Students can toggle notifications per major. Creating a news item sends a push notification to all subscribed browsers for that major. Clicking the notification opens the correct news page.

### Tasks

- [x] **M5-T1: Create notification toggle component**
  Create `components/notification-toggle.tsx`. Bell icon button with on/off visual state. Props: `majorId`, `universitySlug`, `majorSlug`. Uses `usePushSubscription` hook. Shows loading spinner during subscribe/unsubscribe. If push not supported, hide the toggle. On enable: prompt browser permission, subscribe, call `pushSubscriptions.subscribe` mutation. On disable: call `pushSubscriptions.unsubscribe` mutation.

- [x] **M5-T2: Add notification toggle to major page**
  Place `<NotificationToggle>` on the major page (`app/[universitySlug]/[majorSlug]/page.tsx`) in the hero section near the news button. Pass `majorId`, `universitySlug`, `majorSlug` as props.

- [x] **M5-T3: Add notification toggle to news page**
  Place `<NotificationToggle>` on the news page header as well, so students can subscribe while browsing news.

- [x] **M5-T4: Create `notifications.send` action**
  Create `convex/notifications.ts` with a `send({ newsId })` Convex action (uses `"use node"`). Fetch news doc to get `majorId` and `title`. Fetch major doc to get slug. Fetch university doc to get slug. Query all `pushSubscriptions` where `majorIds` contains this `majorId`. For each subscription, call `webpush.sendNotification()` with payload: `{ title, body: "اضغط لعرض الأخبار", url: "/{universitySlug}/{majorSlug}/news" }`. Catch 410 Gone errors and delete expired subscription records via internal mutation.

- [x] **M5-T5: Trigger notification dispatch from `news.add`**
  Update `news.add` mutation to schedule `notifications.send` action after successful insert. Use `ctx.scheduler.runAfter(0, internal.notifications.send, { newsId })` so notification dispatch is async and doesn't block the mutation.

- [x] **M5-T6: Create cleanup mutation for expired subscriptions**
  Create `pushSubscriptions.removeExpired({ endpoint })` internal mutation. Called by `notifications.send` action when a 410 response is received. Deletes the subscription record by endpoint.

- [x] **M5-T7: Handle browser permission denied state**
  In `NotificationToggle`, check `Notification.permission`. If "denied", show disabled toggle with tooltip explaining the user needs to enable notifications in browser settings. If "default", requesting permission is handled on toggle enable.

---

## M6: Integration Testing & Polish

End-to-end validation across all milestones.

**Done when:** All 12 acceptance criteria from the PRD pass.

### Tasks

- [x] **M6-T1: Test contributor news CRUD flow**
  Verify: contributor can create news with title + rich text for assigned major. Can edit existing news. Can soft-delete news. Cannot create/edit news for unassigned major (permission error). Soft-deleted news doesn't appear in list.

- [x] **M6-T2: Test public news page**
  Verify: news page loads with SSR. Newest items appear first. Infinite scroll loads more items. Empty state shows correctly. Breadcrumbs and back navigation work. HTML content renders correctly with RTL. Page metadata is correct.

- [ ] **M6-T3: Test push notification subscription flow**
  Verify: toggle is hidden when push not supported. First enable prompts browser permission. Subscribe creates/upserts record in Convex. Unsubscribe removes majorId from record. Toggle state persists across page reloads. Subscribing to multiple majors creates a single subscription record with multiple majorIds.

- [ ] **M6-T4: Test push notification dispatch**
  Verify: creating news triggers notification to all subscribed browsers for that major. Notification shows correct title and Arabic body. Clicking notification opens correct news page. 410 responses clean up expired subscriptions.

- [ ] **M6-T5: Test edge cases**
  Verify: notification permission denied shows disabled state. Service worker updates correctly. Multiple rapid toggles don't create duplicate subscriptions. Deleted major's subscriptions don't cause errors. News for soft-deleted major doesn't trigger notifications.

- [x] **M6-T6: SEO & sitemap audit**
  Verify: news pages appear in sitemap. Meta tags render correctly. OG tags work for social sharing. SSR output is correct (view source check).

- [x] **M6-T7: RTL & Arabic polish**
  Verify: all new UI labels are in Arabic. News cards render RTL correctly. Tiptap content in news cards respects RTL. Dates formatted in Arabic locale. Toast messages in Arabic.
