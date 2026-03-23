# Resource Helpfulness Signal

## Summary

Add lightweight anonymous feedback to course resources using the existing browser visitorKey, then use that signal to surface stronger material faster. The public course
page stays server-rendered for SEO and first paint, while the existing client-side resources section handles vote interactions and per-visitor state.

## Key Changes

- Extend convex/schema.ts with a new resourceVotes table:
  - Fields: resourceId, courseId, visitorKey, vote ("useful" or "not_useful"), createdAt, updatedAt
  - Indexes: by_resourceId, by_resourceId_visitorKey, by_courseId, by_visitorKey_courseId
- Keep vote aggregates derived from resourceVotes in v1 instead of denormalizing onto resources; this avoids a backfill and keeps the feature lightweight.
- Expand the public resource API in convex/resources.ts:
  - listByCourse(courseId) returns each resource plus usefulCount, notUsefulCount, helpfulnessScore, and totalFeedback
  - getViewerVotesByCourse(courseId, visitorKey) returns the current browser’s vote per resource for active button styling
  - setVote(resourceId, visitorKey, vote) upserts or clears a vote
- Define setVote semantics explicitly:
  - First click inserts the selected vote
  - Clicking the same choice again removes the vote
  - Clicking the opposite choice switches the vote
  - Soft-deleted or missing resources reject voting
- Keep the route page server-side and pass only serializable resource data into the existing client section, matching current Next.js server/client boundaries.
- Update components/course-resources-section.tsx:
  - Add a new ابدأ من هنا block above the category sections
  - Show up to 3 resources with the strongest positive helpfulness signal across the course
  - Hide this block when no resource has a positive score
  - Add useful / not useful buttons and a small visible score/count indicator on each card
  - Highlight the current browser’s vote and prevent duplicate rapid submissions for the same resource while a vote is in flight
- Preserve the current category tabs/sections, but sort resources within each category by:
  - helpfulnessScore descending
  - usefulCount descending
  - existing manual order ascending

## Public Interfaces

- New public mutation: resources.setVote({ resourceId, visitorKey, vote })

## Test Plan

- Vote useful on an unvoted resource and verify counts, active state, and sort order update.
- Switch from useful to not useful and verify aggregates recalculate correctly.
- Click the active vote again and verify the vote is removed.
- Reload the same course page in the same browser and verify the prior vote state is restored.
- Open the page in a separate browser/profile and verify voting is independent.
- Verify ابدأ من هنا appears only when at least one resource has a positive score and never shows more than 3 items.
- Verify category tabs still work and unvoted resources fall back to existing manual order when scores tie.
- Run the normal project verification pass after implementation: typecheck/build and a manual browser check on at least one course page.

## Assumptions

- Anonymous feedback is best-effort, not abuse-proof; the existing browser visitorKey is sufficient for this iteration.
- No student account system is introduced.
- Counts are shown inline on resource cards because the chosen UX is “buttons + score”.
- Admin moderation, broken-link reporting, and analytics dashboards for votes are out of scope for this slice.
