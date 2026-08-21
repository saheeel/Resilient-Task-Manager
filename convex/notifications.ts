import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    return notifications;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
      
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

export const clearAll = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
      
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

export const insert = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      body: args.body,
      url: args.url,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Cleanup to prevent storage bloat (keep only last 50)
    // Querying all is fine here because we aggressively prune to 50
    const allUserNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (allUserNotifications.length > 50) {
      const toDelete = allUserNotifications.slice(50);
      for (const notification of toDelete) {
        await ctx.db.delete(notification._id);
      }
    }
  },
});
