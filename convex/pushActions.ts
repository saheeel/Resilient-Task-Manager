"use node";

declare const process: any;

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
// @ts-ignore
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:saheeel@resilient.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn("Warning: VAPID keys are missing from environment variables. Push alerts will be bypassed.");
}

// Send Push Notification Action (runs off-thread, can make HTTP calls)
export const sendNotification = action({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Call the queries in pushMutations to fetch tokens!
    const subscriptions = await ctx.runQuery(api.pushMutations.getSubscriptions, { userId: args.userId });
    
    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/",
    });

    // Save notification to history
    await ctx.runMutation(api.notifications.insert, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      url: args.url || "/",
    });

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          }
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error: any) {
        console.error("Failed to send push notification to endpoint:", sub.endpoint, error);
        // If push subscription is dead or invalid (404/410), delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await ctx.runMutation(api.pushMutations.removeSubscription, { id: sub._id });
        }
      }
    }
  }
});

// Notify all admin-side users (fan-out) when an employee completes a task
export const notifyAdmins = action({
  args: {
    taskTitle: v.string(),
    employeeName: v.string(),
    taskId: v.string(),
    excludeUserId: v.optional(v.string()),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const adminIds: string[] = await ctx.runQuery(api.pushMutations.getAdminIds);

    const payload = JSON.stringify({
      title: args.title || "✅ Task Completed",
      body: args.body || `${args.employeeName} completed: ${args.taskTitle}`,
      url: `/task/${args.taskId}`,
    });

    for (const adminId of adminIds) {
      if (args.excludeUserId && adminId === args.excludeUserId) continue;

      // Save notification to history
      await ctx.runMutation(api.notifications.insert, {
        userId: adminId,
        title: args.title || "✅ Task Completed",
        body: args.body || `${args.employeeName} completed: ${args.taskTitle}`,
        url: `/task/${args.taskId}`,
      });

      const subscriptions = await ctx.runQuery(api.pushMutations.getSubscriptions, { userId: adminId });
      for (const sub of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          console.error("Failed to notify admin:", sub.endpoint, error);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await ctx.runMutation(api.pushMutations.removeSubscription, { id: sub._id });
          }
        }
      }
    }
  }
});

