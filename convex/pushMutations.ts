import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Register a new device push subscription
export const subscribe = mutation({
  args: {
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // Check if subscription endpoint already exists
    const existing = await ctx.db.query("pushSubscriptions")
      .filter((q: any) => q.eq(q.field("endpoint"), args.endpoint))
      .first();
      
    if (!existing) {
      await ctx.db.insert("pushSubscriptions", args);
    } else {
      // Update userId if device logged in as a different user
      await ctx.db.patch(existing._id, { userId: args.userId });
    }
  }
});

// Retrieve subscriptions for a user (called internally by action)
export const getSubscriptions = query({
  args: { userId: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.query("pushSubscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .collect();
  }
});

// Delete an expired/invalid subscription (called internally by action)
export const removeSubscription = mutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.id);
  }
});
