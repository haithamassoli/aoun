"use node";

import webpush from "web-push";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const send = action({
  args: { newsId: v.id("news") },
  returns: v.null(),
  handler: async (ctx, { newsId }) => {
    const news = await ctx.runQuery(internal.newsInternal.getById, { newsId });
    if (!news) return null;

    const major = await ctx.runQuery(internal.newsInternal.getMajorById, {
      majorId: news.majorId,
    });
    if (!major || major.deletedAt !== undefined) return null;

    const university = await ctx.runQuery(
      internal.newsInternal.getUniversityById,
      { universityId: major.universityId },
    );
    if (!university || university.deletedAt !== undefined) return null;

    const subscriptions = await ctx.runQuery(
      internal.newsInternal.getSubscriptionsByMajor,
      { majorId: news.majorId },
    );

    if (subscriptions.length === 0) return null;

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
    const vapidSubject = process.env.VAPID_SUBJECT!;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const newsUrl = `/${university.slug}/${major.slug}/news`;
    const payload = JSON.stringify({
      title: news.title,
      body: "اضغط لعرض الخبر",
      url: newsUrl,
    });

    const results = await Promise.allSettled(
      subscriptions.map(
        (sub: { endpoint: string; p256dh: string; auth: string }) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          ),
      ),
    );

    // Clean up expired subscriptions (410 Gone)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        const statusCode = (result.reason as { statusCode?: number })
          ?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await ctx.runMutation(internal.pushSubscriptions.removeExpired, {
            endpoint: subscriptions[i].endpoint,
          });
        }
      }
    }

    return null;
  },
});

export const sendCustom = action({
  args: {
    token: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    majorId: v.optional(v.id("majors")),
  },
  returns: v.object({ sent: v.number() }),
  handler: async (ctx, { token, title, body, url, majorId }) => {
    const subscriptions = await ctx.runQuery(
      internal.notificationsInternal.getValidatedSubscriptions,
      { token, majorId },
    );

    if (subscriptions.length === 0) return { sent: 0 };

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
    const vapidSubject = process.env.VAPID_SUBJECT!;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? "/",
    });

    const results = await Promise.allSettled(
      subscriptions.map(
        (sub: { endpoint: string; p256dh: string; auth: string }) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          ),
      ),
    );

    let sent = 0;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        sent++;
      } else {
        const statusCode = (result.reason as { statusCode?: number })
          ?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await ctx.runMutation(internal.pushSubscriptions.removeExpired, {
            endpoint: subscriptions[i].endpoint,
          });
        }
      }
    }

    return { sent };
  },
});
