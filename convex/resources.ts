import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertCanEditCourse,
  assertCanEditResource,
  authenticateUser,
  isNotDeleted,
  softDeleteFields,
} from "./helpers";

const resourceType = v.union(v.literal("link"), v.literal("richtext"));
const resourceCategory = v.union(
  v.literal("notes"),
  v.literal("exams"),
  v.literal("videos"),
  v.literal("summaries"),
  v.literal("tips"),
  v.literal("other")
);

const resourceDoc = v.object({
  _id: v.id("resources"),
  _creationTime: v.number(),
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
});

function assertSafeUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new ConvexError({ code: "INVALID_URL_PROTOCOL" });
    }
  } catch (error) {
    if (error instanceof ConvexError) {
      throw error;
    }
    throw new ConvexError({ code: "INVALID_URL" });
  }
}

export const listByCourse = query({
  args: { courseId: v.id("courses") },
  returns: v.array(resourceDoc),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("resources")
      .withIndex("by_courseId_order", (q) => q.eq("courseId", args.courseId))
      .collect();
    return all.filter(isNotDeleted);
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    courseId: v.id("courses"),
    type: resourceType,
    category: resourceCategory,
    title: v.string(),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.number(),
  },
  returns: v.id("resources"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditCourse(ctx, user._id, args.courseId);

    if (args.url) assertSafeUrl(args.url);

    const now = Date.now();
    return await ctx.db.insert("resources", {
      courseId: args.courseId,
      type: args.type,
      category: args.category,
      title: args.title,
      url: args.url,
      content: args.content,
      order: args.order,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    resourceId: v.id("resources"),
    title: v.optional(v.string()),
    category: v.optional(resourceCategory),
    type: v.optional(resourceType),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditResource(ctx, user._id, args.resourceId);

    if (args.url) assertSafeUrl(args.url);

    const { resourceId, token: _token, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch("resources", resourceId, {
        ...filtered,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    resourceId: v.id("resources"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditResource(ctx, user._id, args.resourceId);

    const resource = await ctx.db.get("resources", args.resourceId);
    if (!resource || resource.deletedAt !== undefined) {
      return null;
    }

    await ctx.db.patch("resources", args.resourceId, softDeleteFields(user._id));
    return null;
  },
});
