import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { assertAdmin, authenticateUser } from "./helpers";

const userRole = v.union(v.literal("admin"), v.literal("contributor"));
const publicUser = v.object({
  _id: v.id("users"),
  name: v.string(),
  email: v.string(),
  role: userRole,
});

const permissionDoc = v.object({
  _id: v.id("permissions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  majorId: v.id("majors"),
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      role: userRole,
      passwordHash: v.string(),
    })
  ),
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const createSession = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { userId, token, expiresAt }) => {
    await ctx.db.insert("sessions", { userId, token, expiresAt });
    return null;
  },
});

export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  returns: v.union(v.null(), publicUser),
  handler: async (ctx, { token }) => {
    if (!token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get("users", session.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (session) {
      await ctx.db.delete("sessions", session._id);
    }

    return null;
  },
});

export const createUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: userRole,
    passwordHash: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new ConvexError({ code: "EMAIL_ALREADY_EXISTS" });
    }

    return await ctx.db.insert("users", args);
  },
});

export const listUsers = query({
  args: { token: v.string() },
  returns: v.array(publicUser),
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  },
});

export const deleteUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    if (admin._id === args.userId) {
      throw new ConvexError({ code: "CANNOT_DELETE_SELF" });
    }

    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    await Promise.all(
      permissions.map((perm) => ctx.db.delete("permissions", perm._id))
    );

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    await Promise.all(sessions.map((session) => ctx.db.delete("sessions", session._id)));

    await ctx.db.delete("users", args.userId);
    return null;
  },
});

export const getUserPermissions = query({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  returns: v.array(permissionDoc),
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    return await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addPermission = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    majorId: v.id("majors"),
  },
  returns: v.id("permissions"),
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_userId_majorId", (q) =>
        q.eq("userId", args.userId).eq("majorId", args.majorId)
      )
      .unique();

    if (existing) {
      throw new ConvexError({ code: "PERMISSION_ALREADY_EXISTS" });
    }

    return await ctx.db.insert("permissions", {
      userId: args.userId,
      majorId: args.majorId,
    });
  },
});

export const removePermission = mutation({
  args: {
    token: v.string(),
    permissionId: v.id("permissions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    await ctx.db.delete("permissions", args.permissionId);
    return null;
  },
});

export const getMyPermissions = query({
  args: { token: v.optional(v.string()) },
  returns: v.union(
    v.null(),
    v.object({
      fullAccess: v.boolean(),
      majorIds: v.array(v.id("majors")),
    })
  ),
  handler: async (ctx, { token }) => {
    if (!token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get("users", session.userId);
    if (!user) return null;

    if (user.role === "admin") {
      return { fullAccess: true, majorIds: [] };
    }

    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      fullAccess: false,
      majorIds: permissions.map((p) => p.majorId),
    };
  },
});
