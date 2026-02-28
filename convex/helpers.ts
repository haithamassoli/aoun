import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ── Authenticate user from session token ──────────────────────────────
export async function authenticateUser(
  ctx: QueryCtx | MutationCtx,
  token?: string
) {
  if (!token) throw new Error("NOT_AUTHENTICATED");

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) throw new Error("NOT_AUTHENTICATED");
  if (session.expiresAt < Date.now()) throw new Error("SESSION_EXPIRED");

  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error("NOT_AUTHENTICATED");

  return user;
}

// ── Get permissions for a user ────────────────────────────────────────
// Returns { fullAccess: true } for admins, or { fullAccess: false, majorIds: [...] } for contributors
export async function getPermissions(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.role === "admin") {
    return { fullAccess: true as const, majorIds: [] as Id<"majors">[] };
  }

  const permissions = await ctx.db
    .query("permissions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  return {
    fullAccess: false as const,
    majorIds: permissions.map((p) => p.majorId),
  };
}

// ── Assert user can edit a major ──────────────────────────────────────
export async function assertCanEditMajor(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  majorId: Id<"majors">
) {
  const perms = await getPermissions(ctx, userId);
  if (perms.fullAccess) return;

  if (!perms.majorIds.some((id) => id === majorId)) {
    throw new Error("FORBIDDEN");
  }
}

// ── Assert user can edit a course (resolves course → major) ───────────
export async function assertCanEditCourse(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  courseId: Id<"courses">
) {
  const course = await ctx.db.get(courseId);
  if (!course) throw new Error("COURSE_NOT_FOUND");

  await assertCanEditMajor(ctx, userId, course.majorId);
}

// ── Assert user can edit a resource (resolves resource → course → major)
export async function assertCanEditResource(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  resourceId: Id<"resources">
) {
  const resource = await ctx.db.get(resourceId);
  if (!resource) throw new Error("RESOURCE_NOT_FOUND");

  await assertCanEditCourse(ctx, userId, resource.courseId);
}

// ── Assert user is admin ──────────────────────────────────────────────
export async function assertAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED");
  }
}
