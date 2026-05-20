"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
// @ts-ignore
import webpush from "web-push";

const VAPID_PUBLIC_KEY = "BLgD25tF_Y0bXYc-I6KVYTGC_3iHSuXj6MrKBQUsJYuEXxhnWu9UFV8RF-fUnbkAsbDKNzwJxV4rCmsc3Cx3cj4";
const VAPID_PRIVATE_KEY = "lU0k0Rs2YNqjlgMSOG0TX9mIdXCOBYaAlq1UvEbi3ao";

webpush.setVapidDetails(
  "mailto:saheeel@resilient.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

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
