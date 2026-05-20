import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks
export const list = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("tasks").collect();
  },
});

// Create a new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    status: v.string(),
    priority: v.string(),
    assignedTo: v.array(v.string()),
    dueDate: v.optional(v.string()),
    remarks: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    createdAt: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      type: args.type,
      status: args.status,
      priority: args.priority,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      remarks: args.remarks,
      attachments: args.attachments,
      createdAt: args.createdAt || new Date().toISOString(),
    });
    return taskId;
  },
});

// Update an existing task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    remarks: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    completedAt: v.optional(v.string()),
    completionComment: v.optional(v.string()),
    blockReason: v.optional(v.string()),
    proofPhotoUrl: v.optional(v.string()),
    markedIssueAt: v.optional(v.string()),
    startedAt: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Delete a task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.id);
  },
});

// Seed default tasks if empty
export const seed = mutation({
  handler: async (ctx: any) => {
    const existing = await ctx.db.query("tasks").collect();
    if (existing.length === 0) {
      // Find seeded users to assign to them
      const users = await ctx.db.query("users").collect();
      const anna = users.find((u: any) => u.name.includes("Anna"));
      const tom = users.find((u: any) => u.name.includes("Tom"));
      
      const annaId = anna ? anna._id : "u1";
      const tomId = tom ? tom._id : "u2";

      await ctx.db.insert("tasks", {
        title: "Setup projector in Meeting Room A",
        description: "Ensure the 4K projector is connected to the Apple TV and cables are hidden.",
        type: "one-time",
        status: "open",
        priority: "high",
        assignedTo: [annaId],
        dueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      await ctx.db.insert("tasks", {
        title: "Run dishwasher",
        description: "Load all cups and start the quick wash cycle.",
        type: "daily",
        status: "completed",
        priority: "medium",
        assignedTo: [annaId, tomId],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      await ctx.db.insert("tasks", {
        title: "Organize storage area",
        description: "Stack extra chairs and organize the cleaning supplies.",
        type: "weekly",
        status: "in_progress",
        priority: "low",
        assignedTo: [tomId],
        createdAt: new Date().toISOString(),
      });
    }
  },
});
