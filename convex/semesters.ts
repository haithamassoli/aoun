import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import {
  assertCanEditMajor,
  authenticateUser,
  isNotDeleted,
  softDeleteFields,
} from "./helpers";

const semesterDoc = v.object({
  _id: v.id("semesters"),
  _creationTime: v.number(),
  majorId: v.id("majors"),
  name: v.string(),
  order: v.number(),
});

function normalizeSemesterName(name: string) {
  return name.trim();
}

async function assertSemesterNameIsAvailable(
  ctx: MutationCtx,
  majorId: Id<"majors">,
  name: string,
  currentSemesterId?: Id<"semesters">,
) {
  const existing = await ctx.db
    .query("semesters")
    .withIndex("by_majorId_name", (q) =>
      q.eq("majorId", majorId).eq("name", name),
    )
    .collect();

  const conflict = existing.find(
    (semester) =>
      isNotDeleted(semester) && semester._id !== currentSemesterId,
  );
  if (conflict) {
    throw new ConvexError({ code: "SEMESTER_NAME_EXISTS" });
  }
}

export const listByMajor = query({
  args: { majorId: v.id("majors") },
  returns: v.array(semesterDoc),
  handler: async (ctx, args) => {
    const semesters = await ctx.db
      .query("semesters")
      .withIndex("by_majorId_order", (q) => q.eq("majorId", args.majorId))
      .collect();

    return semesters.filter(isNotDeleted);
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
    name: v.string(),
    order: v.number(),
  },
  returns: v.id("semesters"),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);

    const name = normalizeSemesterName(args.name);
    if (!name) {
      throw new ConvexError({ code: "SEMESTER_NAME_REQUIRED" });
    }

    await assertSemesterNameIsAvailable(ctx, args.majorId, name);

    return await ctx.db.insert("semesters", {
      majorId: args.majorId,
      name,
      order: args.order,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    semesterId: v.id("semesters"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    const semester = await ctx.db.get(args.semesterId);
    if (!semester || semester.deletedAt !== undefined) {
      throw new ConvexError({ code: "SEMESTER_NOT_FOUND" });
    }

    await assertCanEditMajor(ctx, user._id, semester.majorId);

    const updates: { name?: string; order?: number } = {};
    if (args.name !== undefined) {
      const name = normalizeSemesterName(args.name);
      if (!name) {
        throw new ConvexError({ code: "SEMESTER_NAME_REQUIRED" });
      }
      await assertSemesterNameIsAvailable(
        ctx,
        semester.majorId,
        name,
        args.semesterId,
      );
      updates.name = name;
    }
    if (args.order !== undefined) {
      updates.order = args.order;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch("semesters", args.semesterId, updates);
    }

    return null;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    semesterId: v.id("semesters"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    const semester = await ctx.db.get(args.semesterId);
    if (!semester || semester.deletedAt !== undefined) {
      return null;
    }

    await assertCanEditMajor(ctx, user._id, semester.majorId);

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_semesterId", (q) => q.eq("semesterId", args.semesterId))
      .collect();

    await Promise.all(
      courses.map((course) =>
        ctx.db.patch("courses", course._id, { semesterId: undefined }),
      ),
    );
    await ctx.db.patch("semesters", args.semesterId, softDeleteFields(user._id));

    return null;
  },
});
