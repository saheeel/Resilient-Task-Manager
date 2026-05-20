import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.string(), // "employee" | "manager"
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    employeeRole: v.optional(v.string()),
  }).index("by_username", ["username"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // "daily" | "weekly" | "monthly" | "one-time"
    status: v.string(), // "open" | "in_progress" | "completed" | "could_not_complete" | "blocked"
    priority: v.string(), // "low" | "medium" | "high"
    assignedTo: v.array(v.string()), // Array of User IDs (string values)
    assignedById: v.optional(v.string()),
    assignedByName: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    remarks: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    completedAt: v.optional(v.string()),
    completionComment: v.optional(v.string()),
    blockReason: v.optional(v.string()),
    proofPhotoUrl: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    markedIssueAt: v.optional(v.string()),
    startedAt: v.optional(v.string()),
    recurringDay: v.optional(v.string()),
    recurringTime: v.optional(v.string()),
  }),

  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  }).index("by_userId", ["userId"]),
});
