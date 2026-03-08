/**
 * Dev-only seed script.
 * Creates 1 admin, 1 recruiter, 1 candidate user + 1 company.
 *
 * Usage: npx tsx src/scripts/seed.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import argon2 from "argon2";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/ai_recruitment";

async function seed() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const password = await argon2.hash("Password123!");

  // --- Admin ---
  const admin = await User.findOneAndUpdate(
    { email: "admin@example.com" },
    {
      $setOnInsert: {
        email: "admin@example.com",
        passwordHash: password,
        role: "admin",
        name: "Admin User",
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Admin:     ${admin.email} (${admin._id})`);

  // --- Company ---
  let company = await Company.findOne({ name: "Acme Corp" });
  if (!company) {
    company = await Company.create({
      name: "Acme Corp",
      website: "https://acme.example.com",
      ownerUserId: admin._id,
    });
    console.log(`Company:   ${company.name} (${company._id})`);
  } else {
    console.log(`Company:   ${company.name} (${company._id}) [exists]`);
  }

  // --- Recruiter ---
  const recruiter = await User.findOneAndUpdate(
    { email: "recruiter@example.com" },
    {
      $setOnInsert: {
        email: "recruiter@example.com",
        passwordHash: password,
        role: "recruiter",
        name: "Recruiter User",
        companyId: company._id,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Recruiter: ${recruiter.email} (${recruiter._id})`);

  // --- Candidate ---
  const candidate = await User.findOneAndUpdate(
    { email: "candidate@example.com" },
    {
      $setOnInsert: {
        email: "candidate@example.com",
        passwordHash: password,
        role: "candidate",
        name: "Candidate User",
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Candidate: ${candidate.email} (${candidate._id})`);

  console.log("\n✅ Seed complete. Password for all users: Password123!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
