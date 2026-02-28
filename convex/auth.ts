import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { authenticateUser, assertAdmin } from "./helpers";

// ── Get user by email (internal only — prevents password hash leakage) ──
export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

// ── Create session (internal only — prevents token forgery) ─────────────
export const createSession = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { userId, token, expiresAt }) => {
    await ctx.db.insert("sessions", { userId, token, expiresAt });
  },
});

// ── Get current user from session token ─────────────────────────────────
export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// ── Logout mutation ─────────────────────────────────────────────────────
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ── Create user (internal only — prevents unauthenticated account creation) ──
export const createUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("contributor")),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

// ── List all users (admin only) ─────────────────────────────────────────
export const listUsers = query({
  args: { token: v.string() },
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

// ── Delete user (admin only) ────────────────────────────────────────────
export const deleteUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    if (admin._id === args.userId) {
      throw new Error("CANNOT_DELETE_SELF");
    }

    // Delete all permissions for this user
    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const perm of permissions) {
      await ctx.db.delete(perm._id);
    }

    // Delete all sessions for this user
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      if (session.userId === args.userId) {
        await ctx.db.delete(session._id);
      }
    }

    await ctx.db.delete(args.userId);
  },
});

// ── Get permissions for a user (admin only) ─────────────────────────────
export const getUserPermissions = query({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return permissions;
  },
});

// ── Add permission (admin only) ─────────────────────────────────────────
export const addPermission = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    majorId: v.id("majors"),
  },
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    // Check if permission already exists
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (existing.some((p) => p.majorId === args.majorId)) {
      throw new Error("PERMISSION_ALREADY_EXISTS");
    }

    return await ctx.db.insert("permissions", {
      userId: args.userId,
      majorId: args.majorId,
    });
  },
});

// ── Remove permission (admin only) ──────────────────────────────────────
export const removePermission = mutation({
  args: {
    token: v.string(),
    permissionId: v.id("permissions"),
  },
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    await ctx.db.delete(args.permissionId);
  },
});

// ── Get my permissions (for contributors in dashboard) ──────────────────
export const getMyPermissions = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
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
