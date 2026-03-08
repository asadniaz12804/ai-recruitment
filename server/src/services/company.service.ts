import { Company, type ICompany } from "../models/Company.js";
import { User } from "../models/User.js";
import { AppError } from "../lib/errors.js";
import type { CreateCompanyInput } from "../lib/validation.phase2.js";

function safeCompany(company: ICompany) {
  return {
    id: company._id.toString(),
    name: company.name,
    website: company.website ?? null,
    logoUrl: company.logoUrl ?? null,
    ownerUserId: company.ownerUserId.toString(),
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}

export async function createCompany(
  input: CreateCompanyInput,
  userId: string,
  userRole: string
) {
  const company = await Company.create({
    name: input.name,
    website: input.website || undefined,
    logoUrl: input.logoUrl || undefined,
    ownerUserId: userId,
  });

  // If requester is recruiter and has no companyId yet, auto-assign
  if (userRole === "recruiter") {
    const user = await User.findById(userId);
    if (user && !user.companyId) {
      user.companyId = company._id;
      await user.save();
    }
  }

  return safeCompany(company);
}

export async function getCompanyById(companyId: string) {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new AppError(404, "not_found", "Company not found");
  }
  return safeCompany(company);
}

export async function listCompanies(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [companies, total] = await Promise.all([
    Company.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(),
  ]);

  return {
    items: companies.map((c) => safeCompany(c as unknown as ICompany)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
