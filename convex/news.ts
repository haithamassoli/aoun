import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertCanEditMajor,
  authenticateUser,
  isNotDeleted,
  softDeleteFields,
} from "./helpers";
import { paginationOptsValidator } from "convex/server";

export const add = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("news"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);

    if (!args.title.trim()) {
      throw new ConvexError({ code: "TITLE_REQUIRED" });
    }

    const now = Date.now();
    return await ctx.db.insert("news", {
      majorId: args.majorId,
      title: args.title.trim(),
      content: args.content,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    newsId: v.id("news"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);

    const news = await ctx.db.get("news", args.newsId);
    if (!news || news.deletedAt !== undefined) {
      throw new ConvexError({ code: "NEWS_NOT_FOUND" });
    }

    await assertCanEditMajor(ctx, user._id, news.majorId);

    if (args.title !== undefined && !args.title.trim()) {
      throw new ConvexError({ code: "TITLE_REQUIRED" });
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.content !== undefined) updates.content = args.content;

    await ctx.db.patch("news", args.newsId, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    newsId: v.id("news"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);

    const news = await ctx.db.get("news", args.newsId);
    if (!news || news.deletedAt !== undefined) {
      return null;
    }

    await assertCanEditMajor(ctx, user._id, news.majorId);

    await ctx.db.patch("news", args.newsId, softDeleteFields(user._id));
    return null;
  },
});

export const listByMajor = query({
  args: {
    majorId: v.id("majors"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("news")
      .withIndex("by_majorId", (q) => q.eq("majorId", args.majorId))
      .order("desc")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .paginate(args.paginationOpts);
  },
});

export const getLatestByMajor = query({
  args: { majorId: v.id("majors") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("news")
      .withIndex("by_majorId", (q) => q.eq("majorId", args.majorId))
      .order("desc")
      .collect();
    return items.find(isNotDeleted) ?? null;
  },
});
