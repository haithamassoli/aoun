import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { authenticateUser, assertAdmin, assertCanEditMajor } from "./helpers";

export const getValidatedSubscriptions = internalQuery({
  args: {
    token: v.string(),
    majorId: v.optional(v.id("majors")),
  },
  handler: async (ctx, { token, majorId }) => {
    const user = await authenticateUser(ctx, token);
    const all = await ctx.db.query("pushSubscriptions").collect();

    if (majorId !== undefined) {
      await assertCanEditMajor(ctx, user._id, majorId);
      return all
        .filter((s) => s.majorIds.includes(majorId))
        .map((s) => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }));
    }

    await assertAdmin(ctx, user._id);
    return all.map((s) => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }));
  },
});
