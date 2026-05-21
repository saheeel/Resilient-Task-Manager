import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth";
import { admin, emailOTP } from "better-auth/plugins";
import authConfig from "./auth.config";

declare const process: { env: Record<string, string | undefined> };

const siteUrl = process.env.SITE_URL || "http://localhost:5173";
const SUPERADMIN_EMAILS = [
  "ivm@resilient-studios.com",
  "saheel62320@gmail.com",
];

const isSuperAdminEmail = (email?: string | null) =>
  !!email && SUPERADMIN_EMAILS.includes(email.trim().toLowerCase());

const sendOtpEmail = async (email: string, otp: string, type: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.AUTH_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.log(`[auth otp] ${type} code for ${email}: ${otp}`);
    return;
  }

  const subject = type === "sign-in" ? "Your Resilient sign-in code" : "Your Resilient verification code";
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; margin: 16px 0;">${otp}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send OTP email: ${response.status} ${errorBody}`);
  }
};

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [siteUrl],
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
      enabled: false,
      requireEmailVerification: false,
    },
    plugins: [
      admin({
        adminRoles: ["admin"],
      }),
      emailOTP({
        expiresIn: 600,
        otpLength: 6,
        async sendVerificationOTP({ email, otp, type }) {
          await sendOtpEmail(email, otp, type);
        },
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  });
};

export const { getAuthUser } = authComponent.clientApi();
