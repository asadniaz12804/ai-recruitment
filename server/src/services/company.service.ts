import { Company, type ICompany } from "../models/Company.js";
import { User } from "../models/User.js";
import { AppError } from "../lib/errors.js";
import type { CreateCompanyInput } from "../lib/validation.phase2.js";

// --------------- Slug helpers ---------------

/** Convert a string to a URL-safe slug. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")  // Remove special chars
    .replace(/[\s_]+/g, "-")   // Replace spaces/underscores with hyphens
    .replace(/-+/g, "-")       // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, "");  // Trim leading/trailing hyphens
}

/** Generate a unique slug, appending a counter if needed. */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  if (!base) {
    // Fallback for names that are entirely special characters
    return `company-${Date.now()}`;
  }

  let slug = base;
  let counter = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Company.findOne({ slug }).lean();
    if (!existing) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

// --------------- Serialiser ---------------

function safeCompany(company: ICompany) {
  return {
    id: company._id.toString(),
    name: company.name,
    slug: company.slug,
    website: company.website ?? null,
    logoUrl: company.logoUrl ?? null,
    ownerUserId: company.ownerUserId.toString(),
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}

// --------------- Service functions ---------------

export async function createCompany(
  input: CreateCompanyInput,
  userId: string,
  userRole: string
) {
  const slug = await generateUniqueSlug(input.name);

  const company = await Company.create({
    name: input.name,
    slug,
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

export async function getCompanyBySlug(slug: string) {
  const company = await Company.findOne({ slug });
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
