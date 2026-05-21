import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import authConfig from "./auth.config";
import { action } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

const siteUrl = process.env.SITE_URL || "http://localhost:5173";
const trustedOrigins = Array.from(new Set([
  siteUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://resilient-task-manager.vercel.app",
]));
const SUPERADMIN_EMAILS = [
  "ivm@resilient-studios.com",
  "saheel62320@gmail.com",
];

const isSuperAdminEmail = (email?: string | null) =>
  !!email && SUPERADMIN_EMAILS.includes(email.trim().toLowerCase());

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const isSuperAdmin = isSuperAdminEmail(user.email);
            return {
              data: {
                ...user,
                role: isSuperAdmin ? "admin" : "user",
              },
            };
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 4,
    },
    plugins: [
      admin({
        adminRoles: ["admin"],
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  });
};

export const { getAuthUser } = authComponent.clientApi();

export const bootstrapSuperAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    if (!isSuperAdminEmail(normalizedEmail)) {
      throw new Error("This email is not allowed for superadmin bootstrap.");
    }

    const auth = createAuth(ctx);
    await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        password: args.password,
        name: normalizedEmail === "saheel62320@gmail.com" ? "Saheel" : "Ivm",
      },
    });

    return { status: "created" as const };
  },
});
