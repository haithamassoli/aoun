import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  universities: defineTable({
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    order: v.number(),
  }).index("by_slug", ["slug"]),

  majors: defineTable({
    universityId: v.id("universities"),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
  })
    .index("by_universityId", ["universityId"])
    .index("by_slug", ["slug"]),

  courses: defineTable({
    majorId: v.id("majors"),
    name: v.string(),
    slug: v.string(),
    courseCode: v.optional(v.string()),
    semester: v.optional(v.number()),
    order: v.number(),
  })
    .index("by_majorId", ["majorId"])
    .index("by_slug", ["slug"]),

  resources: defineTable({
    courseId: v.id("courses"),
    type: v.union(v.literal("link"), v.literal("richtext")),
    category: v.union(
      v.literal("notes"),
      v.literal("exams"),
      v.literal("videos"),
      v.literal("summaries"),
      v.literal("tips"),
      v.literal("other")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_courseId", ["courseId"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("contributor")),
    passwordHash: v.string(),
  }).index("by_email", ["email"]),

  permissions: defineTable({
    userId: v.id("users"),
    majorId: v.id("majors"),
  }).index("by_userId", ["userId"]),
});
