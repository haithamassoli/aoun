import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { assertAdmin, authenticateUser, isNotDeleted, softDeleteFields } from "./helpers";

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
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!user || user.deletedAt !== undefined) return null;
    return user;
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
    if (!user || user.deletedAt !== undefined) {
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
    // Uniqueness check ignoring soft-deleted rows
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    if (existing.some(isNotDeleted)) {
      throw new ConvexError({ code: "EMAIL_ALREADY_EXISTS" });
    }

    return await ctx.db.insert("users", args);
  },
});

export const updatePasswordHash = internalMutation({
  args: { userId: v.id("users"), passwordHash: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, passwordHash }) => {
    await ctx.db.patch("users", userId, { passwordHash });
    return null;
  },
});

export const listUsers = query({
  args: { token: v.string() },
  returns: v.array(publicUser),
  handler: async (ctx, { token }) => {
    const user = await authenticateUser(ctx, token);
    await assertAdmin(ctx, user._id);

    const users = await ctx.db.query("users").collect();
    return users
      .filter(isNotDeleted)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
      }));
  },
});

export const updateUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(userRole),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await authenticateUser(ctx, args.token);
    await assertAdmin(ctx, admin._id);

    const targetUser = await ctx.db.get("users", args.userId);
    if (!targetUser || targetUser.deletedAt !== undefined) {
      throw new ConvexError({ code: "USER_NOT_FOUND" });
    }

    if (args.email && args.email !== targetUser.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .collect();
      if (existing.some(isNotDeleted)) {
        throw new ConvexError({ code: "EMAIL_ALREADY_EXISTS" });
      }
    }

    const { userId, token: _token, ...rawUpdates } = args;
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch("users", userId, filtered);
    }

    return null;
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

    const targetUser = await ctx.db.get("users", args.userId);
    if (!targetUser || targetUser.deletedAt !== undefined) {
      return null;
    }

    // Soft-delete the user's permissions
    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    await Promise.all(
      permissions
        .filter(isNotDeleted)
        .map((perm) => ctx.db.patch("permissions", perm._id, softDeleteFields(admin._id)))
    );

    // Invalidate sessions (hard delete - sessions don't have soft delete)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    await Promise.all(sessions.map((session) => ctx.db.delete("sessions", session._id)));

    // Soft-delete the user
    await ctx.db.patch("users", args.userId, softDeleteFields(admin._id));
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

    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return permissions.filter(isNotDeleted);
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

    // Uniqueness check ignoring soft-deleted rows
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_userId_majorId", (q) =>
        q.eq("userId", args.userId).eq("majorId", args.majorId)
      )
      .collect();
    if (existing.some(isNotDeleted)) {
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

    const permission = await ctx.db.get("permissions", args.permissionId);
    if (!permission || permission.deletedAt !== undefined) {
      return null;
    }

    await ctx.db.patch("permissions", args.permissionId, softDeleteFields(admin._id));
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
    if (!user || user.deletedAt !== undefined) return null;

    if (user.role === "admin") {
      return { fullAccess: true, majorIds: [] };
    }

    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      fullAccess: false,
      majorIds: permissions
        .filter(isNotDeleted)
        .map((p) => p.majorId),
    };
  },
});
