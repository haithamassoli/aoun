"use node";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

const userRole = v.union(v.literal("admin"), v.literal("contributor"));

type AuthUser = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "admin" | "contributor";
};

type AuthUserWithPassword = AuthUser & {
  passwordHash: string;
};

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    token: v.string(),
    user: v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      role: userRole,
    }),
  }),
  handler: async (ctx, { email, password }): Promise<{ token: string; user: AuthUser }> => {
    const user = (await ctx.runQuery(internal.auth.getUserByEmail, {
      email,
    })) as AuthUserWithPassword | null;

    if (!user) {
      throw new ConvexError({ code: "INVALID_CREDENTIALS" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ConvexError({ code: "INVALID_CREDENTIALS" });
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

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

export const seedAdmin = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.string(),
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

export const seedAccounts = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const results: string[] = [];

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

      await ctx.runMutation(internal.seed.assignContributorPermissions, {
        userId,
        universitySlug: contrib.uniSlug,
      });

      results.push(`Contributor ${contrib.email} created with permissions for ${contrib.uniSlug}`);
    }

    return results.join("\n");
  },
});

export const createContributor = action({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, { token, name, email, password }): Promise<Id<"users">> => {
    const currentUser = await ctx.runQuery(api.auth.getCurrentUser, {
      token,
    });
    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({ code: "ADMIN_REQUIRED" });
    }

    const existing = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (existing) {
      throw new ConvexError({ code: "EMAIL_ALREADY_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    return await ctx.runMutation(internal.auth.createUser, {
      name,
      email,
      role: "contributor",
      passwordHash,
    });
  },
});

export const changePassword = action({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { token, currentPassword, newPassword }) => {
    const user = await ctx.runQuery(api.auth.getCurrentUser, { token });
    if (!user) throw new ConvexError({ code: "UNAUTHORIZED" });

    const fullUser = await ctx.runQuery(internal.auth.getUserByEmail, { email: user.email });
    if (!fullUser) throw new ConvexError({ code: "USER_NOT_FOUND" });

    const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!valid) throw new ConvexError({ code: "INVALID_CURRENT_PASSWORD" });

    if (newPassword.length < 8) throw new ConvexError({ code: "WEAK_PASSWORD" });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await ctx.runMutation(internal.auth.updatePasswordHash, {
      userId: fullUser._id,
      passwordHash,
    });

    return null;
  },
});

export const createUser = action({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: userRole,
  },
  returns: v.id("users"),
  handler: async (ctx, { token, name, email, password, role }): Promise<Id<"users">> => {
    const currentUser = await ctx.runQuery(api.auth.getCurrentUser, {
      token,
    });
    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({ code: "ADMIN_REQUIRED" });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length === 0) {
      throw new ConvexError({ code: "INVALID_NAME" });
    }
    if (password.length < 8) {
      throw new ConvexError({ code: "WEAK_PASSWORD" });
    }

    const existing = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: normalizedEmail,
    });
    if (existing) {
      throw new ConvexError({ code: "EMAIL_ALREADY_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    return await ctx.runMutation(internal.auth.createUser, {
      name: normalizedName,
      email: normalizedEmail,
      role,
      passwordHash,
    });
  },
});
