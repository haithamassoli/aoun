import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  RESOURCE_REQUEST_KINDS,
  RESOURCE_REQUEST_STATUSES,
} from "../lib/resource-requests";

const resourceType = v.union(v.literal("link"), v.literal("richtext"));
const resourceVoteType = v.union(
  v.literal("useful"),
  v.literal("not_useful"),
);
const requestKind = v.union(
  v.literal(RESOURCE_REQUEST_KINDS[0]),
  v.literal(RESOURCE_REQUEST_KINDS[1]),
);
const requestStatus = v.union(
  v.literal(RESOURCE_REQUEST_STATUSES[0]),
  v.literal(RESOURCE_REQUEST_STATUSES[1]),
);
const socialLinks = v.object({
  instagram: v.optional(v.string()),
  facebook: v.optional(v.string()),
  facebookGroup: v.optional(v.string()),
  faculty: v.optional(v.string()),
  telegram: v.optional(v.string()),
});
const resourceCategory = v.union(
  v.literal("notes"),
  v.literal("exams"),
  v.literal("videos"),
  v.literal("summaries"),
  v.literal("tips"),
  v.literal("course_intro"),
  v.literal("comprehensive_post"),
  v.literal("textbook"),
  v.literal("previous_years"),
  v.literal("explanations_notebooks"),
  v.literal("course_drive"),
  v.literal("other"),
);

// Shared soft-delete fields used by all entities
const softDeleteFields = {
  deletedAt: v.optional(v.number()),
  deletedBy: v.optional(v.id("users")),
};

export default defineSchema({
  universities: defineTable({
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    order: v.number(),
    alias: v.optional(v.string()),
    quickLinks: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
        }),
      ),
    ),
    searchToken: v.optional(v.string()),
    ...softDeleteFields,
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"])
    .searchIndex("search_token", {
      searchField: "searchToken",
      filterFields: ["deletedAt"],
    }),

  majors: defineTable({
    universityId: v.id("universities"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
    alias: v.optional(v.string()),
    treeDiagramUrl: v.optional(v.string()),
    socialLinks: v.optional(socialLinks),
    searchToken: v.optional(v.string()),
    ...softDeleteFields,
  })
    .index("by_universityId", ["universityId"])
    .index("by_universityId_order", ["universityId", "order"])
    .index("by_universityId_slug", ["universityId", "slug"])
    .index("by_slug", ["slug"])
    .searchIndex("search_token", {
      searchField: "searchToken",
      filterFields: ["universityId", "deletedAt"],
    }),

  courses: defineTable({
    majorId: v.id("majors"),
    name: v.string(),
    slug: v.string(),
    credits: v.number(),
    courseCode: v.optional(v.string()),
    semester: v.optional(v.string()),
    order: v.number(),
    alias: v.optional(v.string()),
    searchToken: v.optional(v.string()),
    ...softDeleteFields,
  })
    .index("by_majorId", ["majorId"])
    .index("by_majorId_order", ["majorId", "order"])
    .index("by_majorId_slug", ["majorId", "slug"])
    .index("by_slug", ["slug"])
    .searchIndex("search_token", {
      searchField: "searchToken",
      filterFields: ["majorId", "deletedAt"],
    }),

  resources: defineTable({
    courseId: v.id("courses"),
    type: resourceType,
    category: resourceCategory,
    title: v.string(),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    ...softDeleteFields,
  })
    .index("by_courseId", ["courseId"])
    .index("by_courseId_order", ["courseId", "order"]),

  resourceVotes: defineTable({
    resourceId: v.id("resources"),
    courseId: v.id("courses"),
    visitorKey: v.string(),
    vote: resourceVoteType,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_resourceId", ["resourceId"])
    .index("by_resourceId_visitorKey", ["resourceId", "visitorKey"])
    .index("by_courseId", ["courseId"])
    .index("by_visitorKey_courseId", ["visitorKey", "courseId"]),

  resourceRequests: defineTable({
    courseId: v.id("courses"),
    majorId: v.id("majors"),
    visitorKey: v.string(),
    kind: requestKind,
    category: v.optional(resourceCategory),
    note: v.string(),
    suggestedUrl: v.optional(v.string()),
    status: requestStatus,
    createdAt: v.number(),
    fulfilledAt: v.optional(v.number()),
    fulfilledBy: v.optional(v.id("users")),
  })
    .index("by_majorId_status_createdAt", ["majorId", "status", "createdAt"])
    .index("by_courseId_status_createdAt", ["courseId", "status", "createdAt"])
    .index("by_visitorKey_courseId", ["visitorKey", "courseId"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("contributor")),
    passwordHash: v.string(),
    ...softDeleteFields,
  }).index("by_email", ["email"]),

  permissions: defineTable({
    userId: v.id("users"),
    majorId: v.id("majors"),
    ...softDeleteFields,
  })
    .index("by_userId", ["userId"])
    .index("by_userId_majorId", ["userId", "majorId"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  visitors: defineTable({
    visitorKey: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    lastPath: v.string(),
  }).index("by_visitorKey", ["visitorKey"]),

  visitorPageViews: defineTable({
    visitorKey: v.string(),
    dateKey: v.string(),
    pathname: v.string(),
    referrerPath: v.optional(v.string()),
    trackedAt: v.number(),
  })
    .index("by_dateKey", ["dateKey"])
    .index("by_visitorKey_dateKey", ["visitorKey", "dateKey"]),

  visitorDailyVisits: defineTable({
    visitorKey: v.string(),
    dateKey: v.string(),
    pathname: v.string(),
    trackedAt: v.number(),
  })
    .index("by_visitorKey_dateKey", ["visitorKey", "dateKey"])
    .index("by_dateKey", ["dateKey"]),

  visitorDailyStats: defineTable({
    dateKey: v.string(),
    uniqueVisitors: v.number(),
    updatedAt: v.number(),
  }).index("by_dateKey", ["dateKey"]),

  news: defineTable({
    majorId: v.id("majors"),
    title: v.string(),
    content: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    ...softDeleteFields,
  }).index("by_majorId", ["majorId", "createdAt"]),

  pushSubscriptions: defineTable({
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    majorIds: v.array(v.id("majors")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_endpoint", ["endpoint"]),

  partners: defineTable({
    name: v.string(),
    logoStorageId: v.id("_storage"),
    websiteUrl: v.optional(v.string()),
    order: v.number(),
    ...softDeleteFields,
  }).index("by_order", ["order"]),
});
