import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.string(), // "employee" | "admin" | "superadmin"
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    employeeRole: v.optional(v.string()),
    authUserId: v.optional(v.string()),
    authType: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    isPrimarySupervisor: v.optional(v.boolean()),
  }).index("by_username", ["username"]).index("by_email", ["email"]).index("by_authUserId", ["authUserId"]).index("by_role", ["role"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // "daily" | "weekly" | "monthly" | "one-time"
    status: v.string(), // "open" | "in_progress" | "completed" | "could_not_complete" | "blocked"
    priority: v.string(), // "low" | "medium" | "high"
    assignedTo: v.array(v.string()), // Array of User IDs (string values)
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
    createdAt: v.optional(v.string()),
    markedIssueAt: v.optional(v.string()),
    markedIssueBy: v.optional(v.string()),
    startedAt: v.optional(v.string()),
    recurringDay: v.optional(v.string()),
    recurringTime: v.optional(v.string()),
    isPaused: v.optional(v.boolean()),
    pausedAt: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    pendingTransferTo: v.optional(v.string()),
    pendingTransferFrom: v.optional(v.string()),
    pendingTransferComment: v.optional(v.string()),
    transferResult: v.optional(v.string()), // "accepted" or "declined"
    transferResultSeen: v.optional(v.boolean()),
    activeFrom: v.optional(v.string()),
    nextOccurrence: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
  }).index("by_isArchived", ["isArchived"]),

  taskUpdates: defineTable({
    taskId: v.string(),
    userId: v.string(),
    userName: v.string(),
    text: v.string(),
    photoUrl: v.optional(v.string()),
    createdAt: v.string(), // ISO date string
  }).index("by_taskId", ["taskId"]),

  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  }).index("by_userId", ["userId"]).index("by_endpoint", ["endpoint"]),
});
