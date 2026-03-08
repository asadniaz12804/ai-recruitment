import mongoose from "mongoose";
import { User, type IUser } from "../models/User.js";
import { Company } from "../models/Company.js";
import { AuditLog } from "../models/AuditLog.js";
import { AppError } from "../lib/errors.js";
import type { AdminUpdateUserInput, AdminListUsersQuery } from "../lib/validation.phase2.js";

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    companyId: user.companyId?.toString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers(query: AdminListUsersQuery) {
  const { page, limit, role, email } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (email) filter.email = { $regex: email, $options: "i" };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    items: users.map((u) => safeUser(u as unknown as IUser)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateUser(
  targetUserId: string,
  input: AdminUpdateUserInput,
  actorUserId: string
) {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError(404, "not_found", "User not found");
  }

  const changes: Record<string, unknown> = {};
  const warnings: string[] = [];

  // Role update
  if (input.role !== undefined && input.role !== user.role) {
    changes.role = { from: user.role, to: input.role };
    user.role = input.role;
  }

  // CompanyId update
  if (input.companyId !== undefined) {
    if (input.companyId === null) {
      // Remove company association
      changes.companyId = { from: user.companyId?.toString() ?? null, to: null };
      user.companyId = undefined;
    } else {
      // Validate company exists
      const companyExists = await Company.exists({
        _id: new mongoose.Types.ObjectId(input.companyId),
      });
      if (!companyExists) {
        throw new AppError(400, "invalid_company", "Company not found");
      }
      changes.companyId = {
        from: user.companyId?.toString() ?? null,
        to: input.companyId,
      };
      user.companyId = new mongoose.Types.ObjectId(input.companyId);
    }
  }

  // Name update
  if (input.name !== undefined) {
    changes.name = { from: user.name, to: input.name };
    user.name = input.name;
  }

  // AvatarUrl update
  if (input.avatarUrl !== undefined) {
    changes.avatarUrl = { from: user.avatarUrl, to: input.avatarUrl };
    user.avatarUrl = input.avatarUrl || undefined;
  }

  // Warn if setting role to recruiter without companyId
  if (
    user.role === "recruiter" &&
    !user.companyId &&
    input.companyId === undefined
  ) {
    warnings.push(
      "User was set to recruiter role but has no companyId assigned. Consider assigning a company."
    );
  }

  if (Object.keys(changes).length === 0) {
    return { user: safeUser(user), changes: {}, warnings };
  }

  await user.save();

  // Audit log
  await AuditLog.create({
    actorUserId: new mongoose.Types.ObjectId(actorUserId),
    action: "admin.updateUser",
    entityType: "User",
    entityId: targetUserId,
    metadata: changes,
  });

  return { user: safeUser(user), changes, warnings };
}
