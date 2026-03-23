# Course Resource Requests

## Summary

Add a lightweight public request/suggestion flow to course pages, then surface open items to contributors
inside each major dashboard.

The v1 flow is:

1. A visitor opens اطلب مصدر لهذه المادة او اقترح مصدر جديد from the course page.
2. They submit one combined form with:
   - request type: missing_resource or resource_suggestion
   - optional category from existing resource categories
   - required short note
   - optional URL, shown only for resource_suggestion
3. Contributors open a new الطلبات tab on the major dashboard, see open requests for that major grouped by
   course, then manually mark them fulfilled after adding the matching resource.

## Implementation Changes

### Data and Convex API

Add a new resourceRequests table in convex/schema.ts with:

- courseId
- majorId denormalized from the course for major-level queue queries
- visitorKey
- kind: missing_resource | resource_suggestion
- category?
- note
- suggestedUrl?
- status: open | fulfilled
- createdAt
- fulfilledAt?
- fulfilledBy?

Indexes:

- by_majorId_status_createdAt
- by_courseId_status_createdAt
- by_visitorKey_courseId

Add a new Convex domain file for request logic with:

- submitPublic({ courseId, visitorKey, kind, category?, note, suggestedUrl? })
- listOpenForMajor({ token, majorId })
- markFulfilled({ token, requestId })

Behavior:

- submitPublic is anonymous and uses the existing visitorKey model.
- Validate suggestedUrl with the same http/https rule used for resources.
- Reject exact duplicate open submissions from the same visitor for the same course.
- Throttle to max 3 open requests per visitor per course.
- listOpenForMajor must respect existing contributor/admin permissions via assertCanEditMajor.
- markFulfilled sets status, fulfilledAt, and fulfilledBy; no reopen flow in v1.

### Public Course UX

Extend components/course-resources-section.tsx with a compact CTA card that appears:

- below the empty-state card when the course has no resources
- below the resources list when the course already has resources

Use the exact primary copy:

- اطلب مصدر لهذه المادة او اقترح مصدر جديد

Open a lightweight modal using the existing modal/toast patterns. Form rules:

- type selector first
- optional category selector from CATEGORIES
- required note textarea
- optional URL field only for resource_suggestion

Use the existing visitor key initialization already present in this component. Do not render a public list of
requests or comments.

Add a matching Zod schema in lib/schemas.ts for the public form.

### Contributor Dashboard UX

Add requests to the ActiveTab union and tab bar in app/dashboard/major/[majorId]/page.tsx.

Requests tab behavior:

- query open requests for the current major
- show badge count in the tab label
- group items by course
- sort groups by newest open request, and requests newest-first within each group
- each request card shows:
  - course name
  - type chip
  - optional category chip
  - note
  - optional suggested URL
  - created date
- actions:
  - فتح صفحة المادة to the existing course editor route
  - تمت التلبية to mark fulfilled

No separate contributor home queue, no admin-only requests page, and no auto-fulfillment in v1.

## Public API / Types

Add new shared concepts:

- RequestKind = "missing_resource" | "resource_suggestion"
- RequestStatus = "open" | "fulfilled"

New Convex surface:

- api.resourceRequests.submitPublic
- api.resourceRequests.listOpenForMajor
- api.resourceRequests.markFulfilled

Client validation:

- new public request schema in lib/schemas.ts
- reuse existing category values from constant/resource-categories.ts

- Public course page shows the CTA both when resources exist and when the course is empty.
- Anonymous visitor can submit a resource_suggestion with category + note + URL.
- Invalid URL is rejected server-side and surfaced with a toast/form error.
- Exact duplicate open request from the same visitor is rejected.
- Admin can open any major page and see that major’s requests.
- Marking a request fulfilled removes it from the open queue immediately via reactive updates.
- Existing resource voting and resource CRUD flows remain unchanged.
- Run npm run lint and manually verify the public course page plus major dashboard tab switching.

## Assumptions

- Anonymous public submissions are allowed and identified only by the existing browser visitorKey.
- The note field is required; category is optional; URL is optional and only shown for suggestions.
- Fulfillment is a human-confirmed status, not an automatic match and not linked to a specific resource in v1.
- Requests are not publicly visible, editable, deletable, or reopenable in v1.
- Existing Arabic UI style and current modal/toast patterns should be preserved rather than introducing a new
  design system.
