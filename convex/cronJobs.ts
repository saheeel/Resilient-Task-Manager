import { action, internalQuery, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

export interface ReminderItem {
  taskId: string;
  taskTitle: string;
  type: "same_day_reminder" | "start_reminder" | "due_reminder";
  scheduledTime?: string;
  dueDate?: string;
  assignedTo: string[];
}

// Internal query to scan active tasks for same-day, 15m start, and 15m due triggers
export const getApproachingTasks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_isArchived", (q) => q.eq("isArchived", false))
      .collect();

    const now = Date.now();
    const fifteenMinsFromNow = now + 15 * 60 * 1000;
    const todayDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const reminderItems: ReminderItem[] = [];
    const sameDayTaskIds: string[] = [];
    const startTaskIds: string[] = [];
    const dueTaskIds: string[] = [];

    for (const task of tasks) {
      if (task.isPaused) continue;

      const startTimeStr = task.startDate || task.nextOccurrence;
      const dueTimeStr = task.dueDate;

      // 1. Check 15-Minute Start Reminder
      if (startTimeStr && !task.startReminderSentAt && !task.reminderSentAt) {
        const startTime = new Date(startTimeStr).getTime();
        if (startTime > now && startTime <= fifteenMinsFromNow) {
          reminderItems.push({
            taskId: task._id,
            taskTitle: task.title,
            type: "start_reminder",
            scheduledTime: startTimeStr,
            assignedTo: task.assignedTo || [],
          });
          startTaskIds.push(task._id);
        }
      }

      // 2. Check 15-Minute Due Reminder
      if (dueTimeStr && !task.dueReminderSentAt) {
        const dueTime = new Date(dueTimeStr).getTime();
        if (dueTime > now && dueTime <= fifteenMinsFromNow) {
          reminderItems.push({
            taskId: task._id,
            taskTitle: task.title,
            type: "due_reminder",
            dueDate: dueTimeStr,
            assignedTo: task.assignedTo || [],
          });
          dueTaskIds.push(task._id);
        }
      }

      // 3. Check Same-Day Reminder (fires on the day of the task if not yet notified today)
      if (
        (!task.sameDayReminderSentAt || !task.sameDayReminderSentAt.startsWith(todayDateStr)) &&
        (startTimeStr || dueTimeStr)
      ) {
        const targetDateStr = (startTimeStr || dueTimeStr)!.split("T")[0];
        if (targetDateStr === todayDateStr) {
          reminderItems.push({
            taskId: task._id,
            taskTitle: task.title,
            type: "same_day_reminder",
            scheduledTime: startTimeStr,
            dueDate: dueTimeStr,
            assignedTo: task.assignedTo || [],
          });
          sameDayTaskIds.push(task._id);
        }
      }
    }

    return {
      reminderItems,
      sameDayTaskIds,
      startTaskIds,
      dueTaskIds,
    };
  },
});

// Internal mutation to record reminder dispatch timestamps
export const markRemindersSent = internalMutation({
  args: {
    sameDayTaskIds: v.array(v.id("tasks")),
    startTaskIds: v.array(v.id("tasks")),
    dueTaskIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const nowISO = new Date().toISOString();
    const todayDateStr = nowISO.split("T")[0];

    for (const id of args.sameDayTaskIds) {
      await ctx.db.patch(id, { sameDayReminderSentAt: todayDateStr });
    }
    for (const id of args.startTaskIds) {
      await ctx.db.patch(id, { startReminderSentAt: nowISO, reminderSentAt: nowISO });
    }
    for (const id of args.dueTaskIds) {
      await ctx.db.patch(id, { dueReminderSentAt: nowISO });
    }
  },
});

// Action executed by the CRON job every 5 minutes
export const sendApproachingReminders = action({
  args: {},
  handler: async (ctx) => {
    // 1. Find all active reminder triggers
    const { reminderItems, sameDayTaskIds, startTaskIds, dueTaskIds } =
      await ctx.runQuery(internal.cronJobs.getApproachingTasks);

    if (reminderItems.length === 0) return;

    // 2. Mark reminders as sent immediately to avoid duplicate runs
    await ctx.runMutation(internal.cronJobs.markRemindersSent, {
      sameDayTaskIds: sameDayTaskIds as any,
      startTaskIds: startTaskIds as any,
      dueTaskIds: dueTaskIds as any,
    });

    // 3. Fetch user languages for localization
    const users: any[] = await ctx.runQuery(api.users.list);
    const userLanguageMap = new Map<string, string>();
    for (const u of users) {
      if (u._id) {
        userLanguageMap.set(u._id, u.language || "en");
      }
    }

    // 4. Dispatch localized notification to each assignee
    for (const item of reminderItems) {
      for (const userId of item.assignedTo) {
        const lang = userLanguageMap.get(userId) || "en";
        const isDe = lang === "de";

        let title = "";
        let body = "";

        if (item.type === "start_reminder") {
          const timeStr = item.scheduledTime
            ? new Date(item.scheduledTime).toLocaleTimeString(isDe ? "de-DE" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          title = isDe ? `⏰ Startet in 15 Min.: ${item.taskTitle}` : `⏰ Starting in 15m: ${item.taskTitle}`;
          body = isDe
            ? `Beginnt um ${timeStr}. Bitte vorbereiten.`
            : `Starts at ${timeStr}. Please prepare to begin.`;
        } else if (item.type === "due_reminder") {
          const timeStr = item.dueDate
            ? new Date(item.dueDate).toLocaleTimeString(isDe ? "de-DE" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          title = isDe ? `⏳ Fällig in 15 Min.: ${item.taskTitle}` : `⏳ Due in 15m: ${item.taskTitle}`;
          body = isDe
            ? `Fällig um ${timeStr}. Bitte abschließen und einreichen.`
            : `Due at ${timeStr}. Please wrap up and submit.`;
        } else if (item.type === "same_day_reminder") {
          const startTime = item.scheduledTime
            ? new Date(item.scheduledTime).toLocaleTimeString(isDe ? "de-DE" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;
          const dueTime = item.dueDate
            ? new Date(item.dueDate).toLocaleTimeString(isDe ? "de-DE" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          title = isDe ? `📅 Aufgabe heute: ${item.taskTitle}` : `📅 Task Today: ${item.taskTitle}`;

          if (isDe) {
            body = `Heute geplant${startTime ? ` (Start: ${startTime}` : ""}${dueTime ? `${startTime ? ", " : " ("}Fällig: ${dueTime}` : ""}${startTime || dueTime ? ")" : ""}.`;
          } else {
            body = `Scheduled for today${startTime ? ` (Start: ${startTime}` : ""}${dueTime ? `${startTime ? ", " : " ("}Due: ${dueTime}` : ""}${startTime || dueTime ? ")" : ""}.`;
          }
        }

        try {
          await ctx.runAction(api.pushActions.sendNotification, {
            userId,
            title,
            body,
            url: `/task/${item.taskId}`,
            type: item.type,
          });
        } catch (e) {
          console.error(`Failed to send reminder for task ${item.taskId} to user ${userId}`, e);
        }
      }
    }
  },
});

