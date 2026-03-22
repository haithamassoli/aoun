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
const resourceVoteType = v.union(
  v.literal("useful"),
  v.literal("not_useful"),
);
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
  v.literal("other")
);

const resourceWithFeedbackDoc = v.object({
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
  usefulCount: v.number(),
  notUsefulCount: v.number(),
  helpfulnessScore: v.number(),
  totalFeedback: v.number(),
});

function getHelpfulnessScore(usefulCount: number, notUsefulCount: number) {
  return usefulCount - notUsefulCount;
}

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
  returns: v.array(resourceWithFeedbackDoc),
  handler: async (ctx, args) => {
    const [allResources, votes] = await Promise.all([
      ctx.db
        .query("resources")
        .withIndex("by_courseId_order", (q) => q.eq("courseId", args.courseId))
        .collect(),
      ctx.db
        .query("resourceVotes")
        .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
        .collect(),
    ]);

    const resources = allResources.filter(isNotDeleted);
    const feedbackByResourceId = new Map<
      string,
      { usefulCount: number; notUsefulCount: number }
    >();

    for (const vote of votes) {
      const feedback = feedbackByResourceId.get(vote.resourceId) ?? {
        usefulCount: 0,
        notUsefulCount: 0,
      };

      if (vote.vote === "useful") {
        feedback.usefulCount += 1;
      } else {
        feedback.notUsefulCount += 1;
      }

      feedbackByResourceId.set(vote.resourceId, feedback);
    }

    return resources.map((resource) => {
      const feedback = feedbackByResourceId.get(resource._id) ?? {
        usefulCount: 0,
        notUsefulCount: 0,
      };
      const totalFeedback = feedback.usefulCount + feedback.notUsefulCount;

      return {
        ...resource,
        usefulCount: feedback.usefulCount,
        notUsefulCount: feedback.notUsefulCount,
        helpfulnessScore: getHelpfulnessScore(
          feedback.usefulCount,
          feedback.notUsefulCount,
        ),
        totalFeedback,
      };
    });
  },
});

export const getViewerVotesByCourse = query({
  args: {
    courseId: v.id("courses"),
    visitorKey: v.string(),
  },
  returns: v.record(v.string(), resourceVoteType),
  handler: async (ctx, args) => {
    const visitorKey = args.visitorKey.trim();
    if (!visitorKey) {
      return {};
    }

    const votes = await ctx.db
      .query("resourceVotes")
      .withIndex("by_visitorKey_courseId", (q) =>
        q.eq("visitorKey", visitorKey).eq("courseId", args.courseId),
      )
      .collect();

    const latestVotes = new Map<
      string,
      { updatedAt: number; vote: "useful" | "not_useful" }
    >();

    for (const vote of votes) {
      const existing = latestVotes.get(vote.resourceId);
      if (!existing || vote.updatedAt >= existing.updatedAt) {
        latestVotes.set(vote.resourceId, {
          updatedAt: vote.updatedAt,
          vote: vote.vote,
        });
      }
    }

    return Object.fromEntries(
      Array.from(latestVotes.entries()).map(([resourceId, vote]) => [
        resourceId,
        vote.vote,
      ]),
    );
  },
});

export const setVote = mutation({
  args: {
    resourceId: v.id("resources"),
    visitorKey: v.string(),
    vote: resourceVoteType,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const visitorKey = args.visitorKey.trim();
    if (!visitorKey) {
      throw new ConvexError({ code: "INVALID_VISITOR_KEY" });
    }

    const resource = await ctx.db.get("resources", args.resourceId);
    if (!resource || resource.deletedAt !== undefined) {
      throw new ConvexError({ code: "RESOURCE_NOT_FOUND" });
    }

    const existingVotes = await ctx.db
      .query("resourceVotes")
      .withIndex("by_resourceId_visitorKey", (q) =>
        q.eq("resourceId", args.resourceId).eq("visitorKey", visitorKey),
      )
      .collect();
    const sortedVotes = existingVotes.toSorted(
      (left, right) => right.updatedAt - left.updatedAt,
    );
    const [currentVote, ...duplicateVotes] = sortedVotes;

    await Promise.all(duplicateVotes.map((voteDoc) => ctx.db.delete(voteDoc._id)));

    if (!currentVote) {
      const now = Date.now();
      await ctx.db.insert("resourceVotes", {
        resourceId: args.resourceId,
        courseId: resource.courseId,
        visitorKey,
        vote: args.vote,
        createdAt: now,
        updatedAt: now,
      });
      return null;
    }

    if (currentVote.vote === args.vote) {
      await ctx.db.delete(currentVote._id);
      return null;
    }

    await ctx.db.patch(currentVote._id, {
      courseId: resource.courseId,
      visitorKey,
      vote: args.vote,
      updatedAt: Date.now(),
    });
    return null;
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

    const rawUpdates = {
      title: args.title,
      category: args.category,
      type: args.type,
      url: args.url,
      content: args.content,
      order: args.order,
    };
    const filtered = Object.fromEntries(
      Object.entries(rawUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch("resources", args.resourceId, {
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
