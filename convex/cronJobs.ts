import { action, internalQuery, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

// Internal query to find tasks that start within the next 15 minutes
export const getApproachingTasks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks")
      .filter(q => q.eq(q.field("isArchived"), false))
      .collect();

    const now = Date.now();
    const fifteenMinsFromNow = now + 15 * 60 * 1000;

    return tasks.filter(task => {
      if (task.reminderSentAt) return false; // Already sent
      
      const startTimeStr = task.startDate || task.nextOccurrence;
      if (!startTimeStr) return false; // No scheduled time

      const startTime = new Date(startTimeStr).getTime();
      return startTime > now && startTime <= fifteenMinsFromNow;
    });
  }
});

// Internal mutation to mark reminders as sent
export const markRemindersSent = internalMutation({
  args: {
    taskIds: v.array(v.id("tasks"))
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    for (const id of args.taskIds) {
      await ctx.db.patch(id, { reminderSentAt: now });
    }
  }
});

// Action executed by the CRON job every 5 minutes
export const sendApproachingReminders = action({
  args: {},
  handler: async (ctx) => {
    // 1. Get tasks
    const approachingTasks = await ctx.runQuery(internal.cronJobs.getApproachingTasks);
    
    if (approachingTasks.length === 0) return;

    // 2. Mark them as sent so we don't double-send
    const taskIds = approachingTasks.map(t => t._id);
    await ctx.runMutation(internal.cronJobs.markRemindersSent, { taskIds });

    // 3. Dispatch notifications
    for (const task of approachingTasks) {
      const timeStr = new Date(task.startDate || task.nextOccurrence!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      for (const userId of task.assignedTo) {
        try {
          await ctx.runAction(api.pushActions.sendNotification, {
            userId,
            title: `Task Reminder: ${task.title}`,
            body: `Starting soon at ${timeStr}.`,
            url: `/task/${task._id}`,
          });
        } catch (e) {
          console.error(`Failed to send reminder for task ${task._id} to user ${userId}`, e);
        }
      }
    }
  }
});
