import mongoose from "mongoose";
import { Interview, type IInterview } from "../models/Interview.js";
import { Offer, type IOffer } from "../models/Offer.js";
import { Application } from "../models/Application.js";
import { AppError } from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import type {
  CreateInterviewInput,
  ListInterviewsQuery,
  CreateOfferInput,
  UpdateOfferStatusInput,
  ListOffersQuery,
} from "../lib/validation.phase6.js";

// ========================================================================
// Helpers
// ========================================================================

function safeInterview(doc: IInterview) {
  return {
    id: doc._id.toString(),
    applicationId: doc.applicationId.toString(),
    companyId: doc.companyId.toString(),
    candidateUserId: doc.candidateUserId.toString(),
    scheduledAt: doc.scheduledAt.toISOString(),
    mode: doc.mode,
    locationOrLink: doc.locationOrLink ?? null,
    notes: doc.notes ?? null,
    createdByUserId: doc.createdByUserId.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function safeOffer(doc: IOffer) {
  return {
    id: doc._id.toString(),
    applicationId: doc.applicationId.toString(),
    companyId: doc.companyId.toString(),
    candidateUserId: doc.candidateUserId.toString(),
    salaryMin: doc.salaryMin ?? null,
    salaryMax: doc.salaryMax ?? null,
    currency: doc.currency,
    message: doc.message ?? null,
    status: doc.status,
    createdByUserId: doc.createdByUserId.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ========================================================================
// Interview: Create (recruiter)
// ========================================================================

export async function createInterview(
  applicationId: string,
  recruiterId: string,
  recruiterCompanyId: string,
  input: CreateInterviewInput
) {
  const app = await Application.findById(applicationId).lean();
  if (!app) {
    throw new AppError(404, "not_found", "Application not found");
  }
  if (app.companyId.toString() !== recruiterCompanyId) {
    throw new AppError(404, "not_found", "Application not found");
  }

  const interview = await Interview.create({
    applicationId: app._id,
    companyId: app.companyId,
    candidateUserId: app.candidateUserId,
    scheduledAt: new Date(input.scheduledAt),
    mode: input.mode,
    locationOrLink: input.locationOrLink,
    notes: input.notes,
    createdByUserId: new mongoose.Types.ObjectId(recruiterId),
  });

  await audit({
    actorUserId: recruiterId,
    action: "interview.create",
    entityType: "Interview",
    entityId: interview._id.toString(),
    metadata: { applicationId, mode: input.mode, scheduledAt: input.scheduledAt },
  });

  return safeInterview(interview);
}

// ========================================================================
// Interview: List for an application (recruiter or candidate owner)
// ========================================================================

export async function listInterviews(
  applicationId: string,
  query: ListInterviewsQuery
) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const filter = {
    applicationId: new mongoose.Types.ObjectId(applicationId),
  };

  const [items, total] = await Promise.all([
    Interview.find(filter)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interview.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => safeInterview(doc as unknown as IInterview)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ========================================================================
// Offer: Create (recruiter)
// ========================================================================

export async function createOffer(
  applicationId: string,
  recruiterId: string,
  recruiterCompanyId: string,
  input: CreateOfferInput
) {
  const app = await Application.findById(applicationId).lean();
  if (!app) {
    throw new AppError(404, "not_found", "Application not found");
  }
  if (app.companyId.toString() !== recruiterCompanyId) {
    throw new AppError(404, "not_found", "Application not found");
  }

  const offer = await Offer.create({
    applicationId: app._id,
    companyId: app.companyId,
    candidateUserId: app.candidateUserId,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    currency: input.currency ?? "USD",
    message: input.message,
    status: "draft",
    createdByUserId: new mongoose.Types.ObjectId(recruiterId),
  });

  await audit({
    actorUserId: recruiterId,
    action: "offer.create",
    entityType: "Offer",
    entityId: offer._id.toString(),
    metadata: { applicationId, currency: offer.currency },
  });

  return safeOffer(offer);
}

// ========================================================================
// Offer: List for an application (recruiter or candidate owner)
// ========================================================================

export async function listOffers(
  applicationId: string,
  query: ListOffersQuery
) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const filter = {
    applicationId: new mongoose.Types.ObjectId(applicationId),
  };

  const [items, total] = await Promise.all([
    Offer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Offer.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => safeOffer(doc as unknown as IOffer)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ========================================================================
// Offer: Update status (recruiter can send; candidate can accept/decline)
// ========================================================================

export async function updateOfferStatus(
  offerId: string,
  input: UpdateOfferStatusInput,
  requestUser: { id: string; role: string }
) {
  if (!offerId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError(404, "not_found", "Offer not found");
  }

  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new AppError(404, "not_found", "Offer not found");
  }

  const newStatus = input.status;
  const currentStatus = offer.status;

  // ---- Recruiter / Admin path ----
  if (requestUser.role === "recruiter" || requestUser.role === "admin") {
    // Recruiter verifies company ownership
    if (requestUser.role === "recruiter") {
      const { User } = await import("../models/User.js");
      const user = await User.findById(requestUser.id)
        .select("companyId")
        .lean();
      if (
        !user?.companyId ||
        user.companyId.toString() !== offer.companyId.toString()
      ) {
        throw new AppError(404, "not_found", "Offer not found");
      }
    }

    // Recruiter can only set draft→sent (or draft→draft, sent→sent is no-op)
    if (newStatus === "sent") {
      if (currentStatus !== "draft" && currentStatus !== "sent") {
        throw new AppError(
          400,
          "invalid_transition",
          `Cannot transition from ${currentStatus} to sent`
        );
      }
      offer.status = "sent";
      await offer.save();
      await audit({
        actorUserId: requestUser.id,
        action: "offer.statusChange",
        entityType: "Offer",
        entityId: offerId,
        metadata: { from: currentStatus, to: "sent" },
      });
      return safeOffer(offer);
    }

    // Allow recruiter to move back to draft from sent
    if (newStatus === "draft") {
      if (currentStatus !== "draft" && currentStatus !== "sent") {
        throw new AppError(
          400,
          "invalid_transition",
          `Cannot transition from ${currentStatus} to draft`
        );
      }
      offer.status = "draft";
      await offer.save();
      await audit({
        actorUserId: requestUser.id,
        action: "offer.statusChange",
        entityType: "Offer",
        entityId: offerId,
        metadata: { from: currentStatus, to: "draft" },
      });
      return safeOffer(offer);
    }

    throw new AppError(
      400,
      "invalid_transition",
      `Recruiter cannot set offer status to ${newStatus}`
    );
  }

  // ---- Candidate path ----
  if (requestUser.role === "candidate") {
    if (offer.candidateUserId.toString() !== requestUser.id) {
      throw new AppError(404, "not_found", "Offer not found");
    }

    if (currentStatus !== "sent") {
      throw new AppError(
        400,
        "invalid_transition",
        `Cannot respond to offer in ${currentStatus} status`
      );
    }

    if (newStatus !== "accepted" && newStatus !== "declined") {
      throw new AppError(
        400,
        "invalid_transition",
        "Candidate can only accept or decline an offer"
      );
    }

    offer.status = newStatus;
    await offer.save();
    await audit({
      actorUserId: requestUser.id,
      action: "offer.statusChange",
      entityType: "Offer",
      entityId: offerId,
      metadata: { from: currentStatus, to: newStatus },
    });
    return safeOffer(offer);
  }

  throw new AppError(403, "forbidden", "Not authorised");
}

// ========================================================================
// Get single offer (for access-checking in routes)
// ========================================================================

export async function getOfferById(offerId: string) {
  if (!offerId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError(404, "not_found", "Offer not found");
  }
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new AppError(404, "not_found", "Offer not found");
  }
  return safeOffer(offer);
}
