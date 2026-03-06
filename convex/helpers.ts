import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

// ── Authenticate user from session token ──────────────────────────────
export async function authenticateUser(
  ctx: QueryCtx | MutationCtx,
  token?: string
) {
  if (!token) {
    throw new ConvexError({ code: "NOT_AUTHENTICATED" });
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) {
    throw new ConvexError({ code: "NOT_AUTHENTICATED" });
  }
  if (session.expiresAt < Date.now()) {
    throw new ConvexError({ code: "SESSION_EXPIRED" });
  }

  const user = await ctx.db.get("users", session.userId);
  if (!user || user.deletedAt !== undefined) {
    throw new ConvexError({ code: "NOT_AUTHENTICATED" });
  }

  return user;
}

// Returns { fullAccess: true } for admins, or { fullAccess: false, majorIds: [...] } for contributors
export async function getPermissions(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const user = await ctx.db.get("users", userId);
  if (!user || user.deletedAt !== undefined) {
    throw new ConvexError({ code: "USER_NOT_FOUND" });
  }

  if (user.role === "admin") {
    return { fullAccess: true as const, majorIds: [] as Id<"majors">[] };
  }

  const permissions = await ctx.db
    .query("permissions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  return {
    fullAccess: false as const,
    majorIds: permissions
      .filter((p) => p.deletedAt === undefined)
      .map((p) => p.majorId),
  };
}

export async function assertCanEditMajor(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  majorId: Id<"majors">
) {
  const perms = await getPermissions(ctx, userId);
  if (perms.fullAccess) return;

  if (!perms.majorIds.includes(majorId)) {
    throw new ConvexError({ code: "FORBIDDEN" });
  }
}

export async function assertCanEditCourse(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  courseId: Id<"courses">
) {
  const course = await ctx.db.get("courses", courseId);
  if (!course || course.deletedAt !== undefined) {
    throw new ConvexError({ code: "COURSE_NOT_FOUND" });
  }

  await assertCanEditMajor(ctx, userId, course.majorId);
}

export async function assertCanEditResource(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  resourceId: Id<"resources">
) {
  const resource = await ctx.db.get("resources", resourceId);
  if (!resource || resource.deletedAt !== undefined) {
    throw new ConvexError({ code: "RESOURCE_NOT_FOUND" });
  }

  await assertCanEditCourse(ctx, userId, resource.courseId);
}

export async function assertAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const user = await ctx.db.get("users", userId);
  if (!user || user.deletedAt !== undefined || user.role !== "admin") {
    throw new ConvexError({ code: "ADMIN_REQUIRED" });
  }
}

// ── Soft delete helper ────────────────────────────────────────────────
export function softDeleteFields(userId: Id<"users">) {
  return {
    deletedAt: Date.now(),
    deletedBy: userId,
  };
}

// ── Non-deleted filter for use with .filter() ─────────────────────────
export function isNotDeleted<T extends { deletedAt?: number }>(doc: T): boolean {
  return doc.deletedAt === undefined;
}
