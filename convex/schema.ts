import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const resourceType = v.union(v.literal("link"), v.literal("richtext"));
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
  v.literal("other")
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
        })
      )
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
    courseCode: v.optional(v.string()),
    semester: v.optional(v.number()),
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
});
