import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const SUPERADMIN_EMAILS = [
  "ivm@resilient-studios.com",
  "saheel62320@gmail.com",
];

const isSuperAdminEmail = (email: string) =>
  SUPERADMIN_EMAILS.includes(email.trim().toLowerCase());

// Get all users
export const list = query({
  handler: async (ctx: any) => {
    return await ctx.db.query("users").collect();
  },
});

// Create a new local employee user
export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    employeeRole: v.optional(v.string()),
    authUserId: v.optional(v.string()),
    authType: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      role: args.role,
      email: args.email,
      username: args.username,
      password: args.password,
      employeeRole: args.employeeRole,
      authUserId: args.authUserId,
      authType: args.authType,
    });
    return userId;
  },
});

export const ensureAuthenticatedAdmin = mutation({
  args: {
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const byAuthUserId = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q: any) => q.eq("authUserId", args.authUserId))
      .first();

    if (byAuthUserId) {
      await ctx.db.patch(byAuthUserId._id, {
        name: args.name,
        email: args.email,
        authType: "better-auth",
      });
      return await ctx.db.get(byAuthUserId._id);
    }

    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (byEmail) {
      await ctx.db.patch(byEmail._id, {
        name: args.name,
        authUserId: args.authUserId,
        authType: "better-auth",
      });
      return await ctx.db.get(byEmail._id);
    }

    if (!isSuperAdminEmail(args.email)) {
      throw new Error("This email is not authorized for admin access.");
    }

    const role = isSuperAdminEmail(args.email) ? "superadmin" : "admin";
    const newUserId = await ctx.db.insert("users", {
      name: args.name,
      role,
      email: args.email,
      authUserId: args.authUserId,
      authType: "better-auth",
    });
    return await ctx.db.get(newUserId);
  },
});

export const syncSuperAdminAllowlist = mutation({
  handler: async (ctx: any) => {
    const users = await ctx.db.query("users").collect();
    const existingEmails = new Set(
      users
        .map((user: any) => user.email?.trim().toLowerCase())
        .filter(Boolean)
    );

    for (const email of SUPERADMIN_EMAILS) {
      if (!existingEmails.has(email)) {
        await ctx.db.insert("users", {
          name: email === SUPERADMIN_EMAILS[0] ? "Ivm" : "Saheel",
          role: "superadmin",
          email,
          password: "1234",
          authType: "local",
        });
      }
    }

    const refreshedUsers = await ctx.db.query("users").collect();

    for (const user of refreshedUsers) {
      if (!user.email) continue;

      const nextRole = isSuperAdminEmail(user.email) ? "superadmin" : (user.role === "superadmin" ? "admin" : user.role);
      const patch: Record<string, any> = {};

      if (nextRole !== user.role) {
        patch.role = nextRole;
      }

      if (isSuperAdminEmail(user.email)) {
        patch.password = "1234";
        patch.authType = "local";
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
      }
    }
  },
});

export const createAdminProfile = mutation({
  args: {
    authUserId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: args.role,
        email: args.email,
        authUserId: args.authUserId,
        password: args.password,
        authType: "better-auth",
      });
      return await ctx.db.get(existing._id);
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      role: args.role,
      email: args.email,
      authUserId: args.authUserId,
      password: args.password,
      authType: "better-auth",
    });
    return await ctx.db.get(userId);
  },
});

// Update an existing user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    employeeRole: v.optional(v.string()),
    authUserId: v.optional(v.string()),
    authType: v.optional(v.string()),
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
      await ctx.db.insert("users", {
        name: "Ivm",
        role: "superadmin",
        email: SUPERADMIN_EMAILS[0],
        password: "1234",
        authType: "local",
      });
      await ctx.db.insert("users", {
        name: "Saheel",
        role: "superadmin",
        email: SUPERADMIN_EMAILS[1],
        password: "1234",
        authType: "local",
      });
      await ctx.db.insert("users", { name: "Anna Schmidt", role: "employee", username: "anna", password: "123", employeeRole: "Lead Support Specialist", authType: "local" });
      await ctx.db.insert("users", { name: "Tom Becker", role: "employee", username: "tom", password: "123", employeeRole: "Operations Coordinator", authType: "local" });
    }
  },
});
