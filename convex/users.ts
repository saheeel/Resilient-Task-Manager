import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all users
export const list = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("users").collect();
  },
});

// Create a new user
export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    employeeRole: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      role: args.role,
      username: args.username,
      password: args.password,
      employeeRole: args.employeeRole,
    });
    return userId;
  },
});

// Update an existing user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    employeeRole: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// Seed default users if the table is empty
export const seed = mutation({
  handler: async (ctx: any) => {
    const existing = await ctx.db.query("users").collect();
    if (existing.length === 0) {
      await ctx.db.insert("users", { name: "System Administrator", role: "manager", username: "admin", password: "admin" });
      await ctx.db.insert("users", { name: "Anna Schmidt", role: "employee", username: "anna", password: "123", employeeRole: "Lead Support Specialist" });
      await ctx.db.insert("users", { name: "Tom Becker", role: "employee", username: "tom", password: "123", employeeRole: "Operations Coordinator" });
      await ctx.db.insert("users", { name: "Sarah Manager", role: "manager", username: "sarah", password: "123" });
    }
  },
});
