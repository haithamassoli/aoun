import { ConvexError, v } from "convex/values";
import type { CategoryValue } from "../constant/resource-categories";
import {
  RESOURCE_REQUEST_KINDS,
  RESOURCE_REQUEST_STATUSES,
  type RequestKind,
} from "../lib/resource-requests";
import { authenticateUser, assertCanEditMajor } from "./helpers";
import { mutation, query } from "./_generated/server";

const resourceCategory = v.union(
  v.literal("notes"),
  v.literal("exams"),
  v.literal("videos"),
  v.literal("summaries"),
  v.literal("tips"),
  v.literal("course_intro"),
  v.literal("comprehensive_post"),
  v.literal("textbook"),
  v.literal("previous_years"),
  v.literal("explanations_notebooks"),
  v.literal("course_drive"),
  v.literal("other"),
);

const requestKind = v.union(
  v.literal(RESOURCE_REQUEST_KINDS[0]),
  v.literal(RESOURCE_REQUEST_KINDS[1]),
);
const requestStatus = v.union(
  v.literal(RESOURCE_REQUEST_STATUSES[0]),
  v.literal(RESOURCE_REQUEST_STATUSES[1]),
);

const openResourceRequestDoc = v.object({
  _id: v.id("resourceRequests"),
  _creationTime: v.number(),
  courseId: v.id("courses"),
  majorId: v.id("majors"),
  visitorKey: v.string(),
  kind: requestKind,
  category: v.optional(resourceCategory),
  note: v.string(),
  suggestedUrl: v.optional(v.string()),
  status: requestStatus,
  createdAt: v.number(),
  fulfilledAt: v.optional(v.number()),
  fulfilledBy: v.optional(v.id("users")),
  courseName: v.string(),
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

function areSameOpenRequest(
  request: {
    kind: RequestKind;
    category?: CategoryValue;
    note: string;
    suggestedUrl?: string;
  },
  candidate: {
    kind: RequestKind;
    category?: CategoryValue;
    note: string;
    suggestedUrl?: string;
  },
) {
  return (
    request.kind === candidate.kind &&
    request.category === candidate.category &&
    request.note === candidate.note &&
    request.suggestedUrl === candidate.suggestedUrl
  );
}

export const submitPublic = mutation({
  args: {
    courseId: v.id("courses"),
    visitorKey: v.string(),
    kind: requestKind,
    category: v.optional(resourceCategory),
    note: v.string(),
    suggestedUrl: v.optional(v.string()),
  },
  returns: v.id("resourceRequests"),
  handler: async (ctx, args) => {
    const visitorKey = args.visitorKey.trim();
    const note = args.note.trim();
    const suggestedUrl =
      args.kind === "resource_suggestion"
        ? args.suggestedUrl?.trim() || undefined
        : undefined;

    if (!visitorKey) {
      throw new ConvexError({ code: "INVALID_VISITOR_KEY" });
    }

    if (!note) {
      throw new ConvexError({ code: "RESOURCE_REQUEST_NOTE_REQUIRED" });
    }

    if (suggestedUrl) {
      assertSafeUrl(suggestedUrl);
    }

    const course = await ctx.db.get("courses", args.courseId);
    if (!course || course.deletedAt !== undefined) {
      throw new ConvexError({ code: "COURSE_NOT_FOUND" });
    }

    const existingRequests = await ctx.db
      .query("resourceRequests")
      .withIndex("by_visitorKey_courseId", (q) =>
        q.eq("visitorKey", visitorKey).eq("courseId", args.courseId),
      )
      .collect();
    const openRequests = existingRequests.filter(
      (request) => request.status === "open",
    );
    const candidateRequest = {
      kind: args.kind,
      category: args.category,
      note,
      suggestedUrl,
    };

    if (
      openRequests.some((request) => areSameOpenRequest(request, candidateRequest))
    ) {
      throw new ConvexError({ code: "RESOURCE_REQUEST_DUPLICATE" });
    }

    if (openRequests.length >= 3) {
      throw new ConvexError({ code: "RESOURCE_REQUEST_LIMIT_REACHED" });
    }

    return await ctx.db.insert("resourceRequests", {
      courseId: args.courseId,
      majorId: course.majorId,
      visitorKey,
      kind: args.kind,
      category: args.category,
      note,
      suggestedUrl,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const listOpenForMajor = query({
  args: {
    token: v.string(),
    majorId: v.id("majors"),
  },
  returns: v.array(openResourceRequestDoc),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    await assertCanEditMajor(ctx, user._id, args.majorId);

    const requests = await ctx.db
      .query("resourceRequests")
      .withIndex("by_majorId_status_createdAt", (q) =>
        q.eq("majorId", args.majorId).eq("status", "open"),
      )
      .collect();
    const sortedRequests = requests.toSorted(
      (left, right) => right.createdAt - left.createdAt,
    );
    const courses = await Promise.all(
      sortedRequests.map((request) => ctx.db.get("courses", request.courseId)),
    );

    return sortedRequests.map((request, index) => ({
      ...request,
      courseName: courses[index]?.name ?? "مادة غير متاحة",
    }));
  },
});

export const markFulfilled = mutation({
  args: {
    token: v.string(),
    requestId: v.id("resourceRequests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authenticateUser(ctx, args.token);
    const request = await ctx.db.get("resourceRequests", args.requestId);

    if (!request) {
      throw new ConvexError({ code: "RESOURCE_REQUEST_NOT_FOUND" });
    }

    await assertCanEditMajor(ctx, user._id, request.majorId);

    if (request.status === "fulfilled") {
      return null;
    }

    await ctx.db.patch("resourceRequests", args.requestId, {
      status: "fulfilled",
      fulfilledAt: Date.now(),
      fulfilledBy: user._id,
    });

    return null;
  },
});
