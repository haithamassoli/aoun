"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ── Login action ────────────────────────────────────────────────────────
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.runQuery(internal.auth.getUserByEmail, { email });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Generate session token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.runMutation(internal.auth.createSession, {
      userId: user._id,
      token,
      expiresAt,
    });

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },
});

// ── Seed admin user ─────────────────────────────────────────────────────
export const seedAdmin = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { name, email, password }) => {
    const existing = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (existing) return "Admin already exists";

    const passwordHash = await bcrypt.hash(password, 12);

    await ctx.runMutation(internal.auth.createUser, {
      name,
      email,
      role: "admin",
      passwordHash,
    });

    return "Admin created successfully";
  },
});

// ── Seed accounts: admin + contributors with permissions ─────────────
export const seedAccounts = action({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];

    // 1. Create admin
    const adminEmail = "admin@aoun.jo";
    const existingAdmin = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: adminEmail,
    });
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash("Admin@123", 12);
      await ctx.runMutation(internal.auth.createUser, {
        name: "مدير النظام",
        email: adminEmail,
        role: "admin",
        passwordHash: adminHash,
      });
      results.push("Admin created: admin@aoun.jo");
    } else {
      results.push("Admin already exists");
    }

    // 2. Create contributors (one per university)
    const contributors = [
      { name: "أحمد الأردني", email: "ahmad@aoun.jo", password: "Contributor@123", uniSlug: "ju" },
      { name: "سارة اليرموك", email: "sara@aoun.jo", password: "Contributor@123", uniSlug: "yu" },
      { name: "محمد الهاشمي", email: "mohammad@aoun.jo", password: "Contributor@123", uniSlug: "hu" },
      { name: "لينا التكنو", email: "lina@aoun.jo", password: "Contributor@123", uniSlug: "just" },
    ];

    for (const contrib of contributors) {
      const existing = await ctx.runQuery(internal.auth.getUserByEmail, {
        email: contrib.email,
      });
      if (existing) {
        results.push(`Contributor ${contrib.email} already exists`);
        continue;
      }

      const hash = await bcrypt.hash(contrib.password, 12);
      const userId = await ctx.runMutation(internal.auth.createUser, {
        name: contrib.name,
        email: contrib.email,
        role: "contributor",
        passwordHash: hash,
      });

      // Assign permissions for all majors in their university
      await ctx.runMutation(internal.seed.assignContributorPermissions, {
        userId,
        universitySlug: contrib.uniSlug,
      });

      results.push(`Contributor ${contrib.email} created with permissions for ${contrib.uniSlug}`);
    }

    return results.join("\n");
  },
});

// ── Create contributor (admin only, needs bcrypt) ───────────────────────
export const createContributor = action({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { token, name, email, password }) => {
    // Verify admin via getCurrentUser
    const currentUser = await ctx.runQuery(api.auth.getCurrentUser, { token });
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("ADMIN_REQUIRED");
    }

    const existing = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

    const passwordHash = await bcrypt.hash(password, 12);

    const userId = await ctx.runMutation(internal.auth.createUser, {
      name,
      email,
      role: "contributor",
      passwordHash,
    });

    return userId;
  },
});
