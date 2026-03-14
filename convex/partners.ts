import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertAdmin,
  authenticateUser,
  isNotDeleted,
  softDeleteFields,
} from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("partners")
      .withIndex("by_order")
      .collect();
    const active = all.filter(isNotDeleted);
    return await Promise.all(
      active.map(async (partner) => ({
        ...partner,
        logoUrl: await ctx.storage.getUrl(partner.logoStorageId),
      }))
    );
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    logoStorageId: v.id("_storage"),
    websiteUrl: v.optional(v.string()),
    order: v.number(),
  },
  returns: v.id("partners"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    if (!args.name.trim()) {
      throw new ConvexError({ code: "NAME_REQUIRED" });
    }

    return await ctx.db.insert("partners", {
      name: args.name.trim(),
      logoStorageId: args.logoStorageId,
      websiteUrl: args.websiteUrl?.trim(),
      order: args.order,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    partnerId: v.id("partners"),
    name: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    websiteUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const partner = await ctx.db.get(args.partnerId);
    if (!partner || partner.deletedAt !== undefined) {
      throw new ConvexError({ code: "PARTNER_NOT_FOUND" });
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.logoStorageId !== undefined) updates.logoStorageId = args.logoStorageId;
    if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl.trim();
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.partnerId, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    partnerId: v.id("partners"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, user._id);

    const partner = await ctx.db.get(args.partnerId);
    if (!partner || partner.deletedAt !== undefined) {
      return null;
    }

    await ctx.db.patch(args.partnerId, softDeleteFields(user._id));
    return null;
  },
});
