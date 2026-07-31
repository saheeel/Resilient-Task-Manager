import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const listPaginatedHistory = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx: any, args) => {
    // Note: since Convex doesn't easily support complex compound filtering on paginated queries without custom indexes,
    // we fetch everything and paginate on the server side using filter if no index exists, OR we just pull history.
    // Wait, `.paginate` is only available on database queries, not filtered arrays.
    // If we want to paginate only completed tasks, we should add an index in `schema.ts`.
    // But adding an index requires changing schema.ts.
    // Let's check if there is a status index.
    return await ctx.db.query("tasks").order("desc").paginate(args.paginationOpts);
  },
});

// Get all tasks, with optional cutoff for completed tasks
export const list = query({
  args: {
    cutoffDate: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    if (!args.cutoffDate) return tasks;

    // Only filter tasks that are completed AND whose completedAt is older than cutoffDate
    return tasks.filter((task: any) => {
      if (task.status !== 'completed' && task.status !== 'could_not_complete') {
        return true; // Keep all active tasks
      }
      
      // If completed but no timestamp, keep it just in case
      if (!task.completedAt && !task.markedIssueAt) return true;
      
      const finishDate = task.completedAt || task.markedIssueAt;
      return finishDate >= args.cutoffDate!;
    });
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
    assignedById: v.optional(v.string()),
    assignedByName: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    remarks: v.optional(v.string()),
    inCharge: v.optional(v.string()),
    materialStatus: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    createdAt: v.optional(v.string()),
    recurringDay: v.optional(v.string()),
    recurringTime: v.optional(v.string()),
    isPaused: v.optional(v.boolean()),
    pausedAt: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    pendingTransferTo: v.optional(v.string()),
    pendingTransferFrom: v.optional(v.string()),
    pendingTransferComment: v.optional(v.string()),
    activeFrom: v.optional(v.string()),
    nextOccurrence: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      type: args.type,
      status: args.status,
      priority: args.priority,
      assignedTo: args.assignedTo,
      assignedById: args.assignedById,
      assignedByName: args.assignedByName,
      dueDate: args.dueDate,
      remarks: args.remarks,
      inCharge: args.inCharge,
      materialStatus: args.materialStatus,
      attachments: args.attachments,
      createdAt: args.createdAt || new Date().toISOString(),
      recurringDay: args.recurringDay,
      recurringTime: args.recurringTime,
      isPaused: args.isPaused,
      pausedAt: args.pausedAt,
      pinned: args.pinned,
      pendingTransferTo: args.pendingTransferTo,
      pendingTransferFrom: args.pendingTransferFrom,
      pendingTransferComment: args.pendingTransferComment,
      activeFrom: args.activeFrom,
      nextOccurrence: args.nextOccurrence,
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
    assignedById: v.optional(v.string()),
    assignedByName: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    remarks: v.optional(v.string()),
    inCharge: v.optional(v.string()),
    materialStatus: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    completedAt: v.optional(v.string()),
    completionComment: v.optional(v.string()),
    blockReason: v.optional(v.string()),
    proofPhotoUrl: v.optional(v.string()),
    proofPhotoUrls: v.optional(v.array(v.string())),
    markedIssueAt: v.optional(v.string()),
    startedAt: v.optional(v.string()),
    recurringDay: v.optional(v.string()),
    recurringTime: v.optional(v.string()),
    isPaused: v.optional(v.boolean()),
    pausedAt: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    pendingTransferTo: v.optional(v.string()),
    pendingTransferFrom: v.optional(v.string()),
    pendingTransferComment: v.optional(v.string()),
    transferResult: v.optional(v.string()),
    transferResultSeen: v.optional(v.boolean()),
    activeFrom: v.optional(v.string()),
    nextOccurrence: v.optional(v.string()),
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

// Rollover recurring task
export const rolloverRecurringTask = mutation({
  args: { id: v.id("tasks"), newActiveFrom: v.string(), newNextOccurrence: v.string() },
  handler: async (ctx: any, args: any) => {
    const task = await ctx.db.get(args.id);
    if (!task || task.status !== "open") return;
    
    // Mark old as could_not_complete and change to one-time
    await ctx.db.patch(args.id, {
      status: "could_not_complete",
      type: "one-time"
    });
    
    // Create new recurring task
    const { _id, _creationTime, ...taskData } = task;
    await ctx.db.insert("tasks", {
      ...taskData,
      status: "open",
      activeFrom: args.newActiveFrom,
      nextOccurrence: args.newNextOccurrence,
    });
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
        assignedByName: "System Administrator",
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
        assignedByName: "System Administrator",
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
        assignedByName: "System Administrator",
        createdAt: new Date().toISOString(),
      });
    }
  },
});
