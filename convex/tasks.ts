import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

const resolveFileUrls = async (ctx: any, task: any) => {
  if (!task.attachments?.length && !task.proofPhotoUrls?.length && !task.proofPhotoUrl) {
    return task;
  }

  let attachments = task.attachments;
  if (attachments) {
    attachments = await Promise.all(attachments.map(async (id: string) => {
      if (id.startsWith("data:") || id.startsWith("http") || id.startsWith("blob:")) return id;
      return (await ctx.storage.getUrl(id)) || id;
    }));
  }
  
  let proofPhotoUrls = task.proofPhotoUrls;
  if (proofPhotoUrls) {
    proofPhotoUrls = await Promise.all(proofPhotoUrls.map(async (id: string) => {
      if (id.startsWith("data:") || id.startsWith("http") || id.startsWith("blob:")) return id;
      return (await ctx.storage.getUrl(id)) || id;
    }));
  }

  let proofPhotoUrl = task.proofPhotoUrl;
  if (proofPhotoUrl && !proofPhotoUrl.startsWith("data:") && !proofPhotoUrl.startsWith("http") && !proofPhotoUrl.startsWith("blob:")) {
    proofPhotoUrl = (await ctx.storage.getUrl(proofPhotoUrl)) || proofPhotoUrl;
  }
  
  return { ...task, attachments, proofPhotoUrls, proofPhotoUrl };
};

export const listPaginatedHistory = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx: any, args: any) => {
    const result = await ctx.db
      .query("tasks")
      .withIndex("by_isArchived", (q: any) => q.eq("isArchived", true))
      .order("desc")
      .paginate(args.paginationOpts);
      
    return {
      ...result,
      page: await Promise.all(result.page.map((task: any) => resolveFileUrls(ctx, task)))
    };
  },
});

// Get a single task by ID
export const getById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const normalizedId = ctx.db.normalizeId("tasks", args.id);
      if (!normalizedId) return null;
      const task = await ctx.db.get(normalizedId);
      if (!task) return null;
      return await resolveFileUrls(ctx, task);
    } catch {
      return null;
    }
  },
});

// Get all tasks, with optional cutoff for completed tasks
export const list = query({
  args: {
    cutoffDate: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // 1. Fetch all active tasks instantly via index
    const rawActiveTasks = await ctx.db
      .query("tasks")
      .withIndex("by_isArchived", (q: any) => q.eq("isArchived", false))
      .collect();
      
    const activeTasks = await Promise.all(rawActiveTasks.map((t: any) => resolveFileUrls(ctx, t)));

    // 2. Fetch recent history tasks (capped dynamically: 80 with cutoff, 300 without)
    const historyLimit = args.cutoffDate ? 80 : 300;
    const recentArchived = await ctx.db
      .query("tasks")
      .withIndex("by_isArchived", (q: any) => q.eq("isArchived", true))
      .order("desc")
      .take(historyLimit);

    let validRecentArchivedRaw = recentArchived;
    if (args.cutoffDate) {
      validRecentArchivedRaw = recentArchived.filter((task: any) => {
        if (!task.completedAt && !task.markedIssueAt) return true;
        const finishDate = task.completedAt || task.markedIssueAt;
        return finishDate >= args.cutoffDate!;
      });
    }
    
    const validRecentArchived = await Promise.all(validRecentArchivedRaw.map((t: any) => resolveFileUrls(ctx, t)));

    return [...activeTasks, ...validRecentArchived];
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
    createdById: v.optional(v.string()),
    createdByName: v.optional(v.string()),
    isSelfAssigned: v.optional(v.boolean()),
    followUpFromId: v.optional(v.string()),
    actualDuration: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    startDate: v.optional(v.string()),
    reminderSentAt: v.optional(v.string()),
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
      createdById: args.createdById,
      createdByName: args.createdByName,
      isSelfAssigned: args.isSelfAssigned,
      followUpFromId: args.followUpFromId,
      actualDuration: args.actualDuration,
      dueDate: args.dueDate,
      startDate: args.startDate,
      reminderSentAt: args.reminderSentAt,
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
      isArchived: ["completed", "could_not_complete", "blocked"].includes(args.status),
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
    createdById: v.optional(v.string()),
    createdByName: v.optional(v.string()),
    isSelfAssigned: v.optional(v.boolean()),
    followUpFromId: v.optional(v.string()),
    actualDuration: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    startDate: v.optional(v.string()),
    reminderSentAt: v.optional(v.string()),
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
    clearDueDate: v.optional(v.boolean()),
    clearStartDate: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const { id, ...fields } = args;
    if (fields.status !== undefined) {
      fields.isArchived = ["completed", "could_not_complete", "blocked"].includes(fields.status);
    }
    if (fields.clearDueDate) {
      fields.dueDate = undefined;
    }
    delete fields.clearDueDate;

    if (fields.clearStartDate) {
      fields.startDate = undefined;
    }
    delete fields.clearStartDate;

    await ctx.db.patch(id, fields);
  },
});

// Backfill missing isArchived flags on old tasks
export const backfillArchived = mutation({
  args: {},
  handler: async (ctx: any) => {
    const allTasks = await ctx.db.query("tasks").collect();
    let count = 0;
    for (const t of allTasks) {
      if (t.isArchived === undefined) {
        const archived = ["completed", "could_not_complete", "blocked"].includes(t.status);
        await ctx.db.patch(t._id, { isArchived: archived });
        count++;
      }
    }
    return count;
  }
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
      type: "one-time",
      isArchived: true
    });
    
    // Create new recurring task
    const { _id, _creationTime, reminderSentAt, ...taskData } = task;
    await ctx.db.insert("tasks", {
      ...taskData,
      status: "open",
      activeFrom: args.newActiveFrom,
      nextOccurrence: args.newNextOccurrence,
      isArchived: false
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
        isArchived: false,
      });
    }
  },
});

export const backfillIsArchived = mutation({
  handler: async (ctx: any) => {
    const tasks = await ctx.db.query("tasks").collect();
    let updated = 0;
    for (const task of tasks) {
      if (task.isArchived === undefined) {
        const isArchived = ["completed", "could_not_complete", "blocked"].includes(task.status);
        await ctx.db.patch(task._id, { isArchived });
        updated++;
      }
    }
    return `Backfilled ${updated} tasks.`;
  },
});
