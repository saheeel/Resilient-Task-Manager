import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all progress updates for a specific task
export const list = query({
  args: { taskId: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("taskUpdates")
      .withIndex("by_taskId", (q: any) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Add a progress update/comment
export const create = mutation({
  args: {
    taskId: v.string(),
    userId: v.string(),
    userName: v.string(),
    text: v.string(),
    photoUrl: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const updateId = await ctx.db.insert("taskUpdates", {
      taskId: args.taskId,
      userId: args.userId,
      userName: args.userName,
      text: args.text,
      photoUrl: args.photoUrl,
      createdAt: args.createdAt || new Date().toISOString(),
    });
    return updateId;
  },
});
