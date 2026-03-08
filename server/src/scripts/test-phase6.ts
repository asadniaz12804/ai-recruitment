/**
 * Phase 6 Integration Tests — Interviews + Offers
 *
 * Prerequisites:
 *   1. MongoDB running
 *   2. Server running on http://localhost:5000
 *   3. Seed data loaded: npx tsx src/scripts/seed.ts
 *
 * Tests cover:
 *   - Recruiter can schedule an interview for an application
 *   - Recruiter can list interviews for an application
 *   - Candidate can view their interviews (read-only)
 *   - Candidate cannot schedule interviews (403)
 *   - Recruiter can create an offer (draft)
 *   - Recruiter can list offers for an application
 *   - Recruiter can send an offer (draft → sent)
 *   - Candidate can view their offers (read-only)
 *   - Candidate can accept a sent offer
 *   - Candidate cannot accept a draft offer (400)
 *   - Candidate can decline a sent offer
 *   - Candidate cannot access another candidate's application (404)
 *
 * Usage:  npx tsx src/scripts/test-phase6.ts
 */

const BASE = process.env.API_BASE ?? "http://localhost:5000";

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: TestResult[] = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
async function api(
  path: string,
  opts: RequestInit = {}
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string>),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function login(email: string, password: string): Promise<string> {
  const { body } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!body?.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }
  return body.data.accessToken;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function assert(name: string, passed: boolean, detail?: string) {
  results.push({ name, passed, detail });
  const icon = passed ? "✅" : "❌";
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

// ================================================================
// TESTS
// ================================================================

async function run() {
  console.log("\n🔬 Phase 6 Integration Tests — Interviews & Offers\n");

  // ---- Login credentials (must match seed data) ----
  let recruiterToken: string;
  let candidateToken: string;

  try {
    recruiterToken = await login("recruiter@example.com", "Password123!");
    candidateToken = await login("candidate@example.com", "Password123!");
  } catch (err) {
    console.error("❌ Could not log in with seed users. Run seed first.");
    console.error(err);
    process.exit(1);
  }
  assert("Login seed users", true);

  // ---- Create a fresh job + application for testing ----
  let applicationId: string;
  let openJobId: string;
  {
    const createRes = await api("/api/jobs", {
      method: "POST",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({
        title: `Phase 6 Test Job ${Date.now()}`,
        description: "Test job for Phase 6 integration tests",
        status: "open",
        employmentType: "full-time",
      }),
    });
    assert("Create fresh open job", createRes.status === 201);
    openJobId = createRes.body.data.id;

    const applyRes = await api(`/api/jobs/${openJobId}/apply`, {
      method: "POST",
      headers: authHeader(candidateToken),
      body: JSON.stringify({}),
    });
    assert("Candidate applies to job", applyRes.status === 201 && !!applyRes.body?.data?.id);
    applicationId = applyRes.body.data.id;
  }

  // ====================================================
  // INTERVIEWS
  // ====================================================

  // ---- 1. Recruiter schedules an interview ----
  let interviewId: string;
  {
    const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { status, body } = await api(
      `/api/applications/${applicationId}/interviews`,
      {
        method: "POST",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({
          scheduledAt,
          mode: "video",
          locationOrLink: "https://meet.example.com/abc",
          notes: "Technical screening round",
        }),
      }
    );
    assert(
      "Recruiter can schedule interview",
      status === 201 && !!body?.data?.id,
      `status=${status}`
    );
    interviewId = body?.data?.id;
  }

  // ---- 2. Recruiter schedules a second interview ----
  {
    const scheduledAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { status } = await api(
      `/api/applications/${applicationId}/interviews`,
      {
        method: "POST",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({
          scheduledAt,
          mode: "onsite",
          locationOrLink: "123 Main St",
        }),
      }
    );
    assert("Recruiter can schedule second interview", status === 201, `status=${status}`);
  }

  // ---- 3. Recruiter lists interviews ----
  {
    const { status, body } = await api(
      `/api/applications/${applicationId}/interviews`,
      { headers: authHeader(recruiterToken) }
    );
    assert(
      "Recruiter can list interviews",
      status === 200 && body?.data?.items?.length === 2,
      `status=${status}, count=${body?.data?.items?.length}`
    );
  }

  // ---- 4. Candidate can view interviews (read-only) ----
  {
    const { status, body } = await api(
      `/api/candidate/applications/${applicationId}/interviews`,
      { headers: authHeader(candidateToken) }
    );
    assert(
      "Candidate can view interviews",
      status === 200 && body?.data?.items?.length === 2,
      `status=${status}, count=${body?.data?.items?.length}`
    );
  }

  // ---- 5. Candidate cannot create interviews (should fail) ----
  {
    const { status } = await api(
      `/api/applications/${applicationId}/interviews`,
      {
        method: "POST",
        headers: authHeader(candidateToken),
        body: JSON.stringify({
          scheduledAt: new Date().toISOString(),
          mode: "phone",
        }),
      }
    );
    assert(
      "Candidate cannot schedule interviews (403)",
      status === 403,
      `status=${status}`
    );
  }

  // ====================================================
  // OFFERS
  // ====================================================

  // ---- 6. Recruiter creates an offer (draft) ----
  let offerId: string;
  {
    const { status, body } = await api(
      `/api/applications/${applicationId}/offers`,
      {
        method: "POST",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({
          salaryMin: 80000,
          salaryMax: 100000,
          currency: "USD",
          message: "We'd love to have you on the team!",
        }),
      }
    );
    assert(
      "Recruiter can create offer (draft)",
      status === 201 && body?.data?.status === "draft",
      `status=${status}, offerStatus=${body?.data?.status}`
    );
    offerId = body?.data?.id;
  }

  // ---- 7. Recruiter lists offers ----
  {
    const { status, body } = await api(
      `/api/applications/${applicationId}/offers`,
      { headers: authHeader(recruiterToken) }
    );
    assert(
      "Recruiter can list offers",
      status === 200 && body?.data?.items?.length === 1,
      `status=${status}, count=${body?.data?.items?.length}`
    );
  }

  // ---- 8. Candidate cannot accept a draft offer ----
  {
    const { status } = await api(
      `/api/candidate/offers/${offerId}/status`,
      {
        method: "PATCH",
        headers: authHeader(candidateToken),
        body: JSON.stringify({ status: "accepted" }),
      }
    );
    assert(
      "Candidate cannot accept draft offer (400)",
      status === 400,
      `status=${status}`
    );
  }

  // ---- 9. Recruiter sends the offer (draft → sent) ----
  {
    const { status, body } = await api(
      `/api/offers/${offerId}/status`,
      {
        method: "PATCH",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({ status: "sent" }),
      }
    );
    assert(
      "Recruiter sends offer (draft → sent)",
      status === 200 && body?.data?.status === "sent",
      `status=${status}, offerStatus=${body?.data?.status}`
    );
  }

  // ---- 10. Candidate can view offers (read-only) ----
  {
    const { status, body } = await api(
      `/api/candidate/applications/${applicationId}/offers`,
      { headers: authHeader(candidateToken) }
    );
    assert(
      "Candidate can view offers",
      status === 200 && body?.data?.items?.length === 1,
      `status=${status}`
    );
    // Verify offer status is "sent"
    assert(
      "Candidate sees offer as sent",
      body?.data?.items?.[0]?.status === "sent",
      `offerStatus=${body?.data?.items?.[0]?.status}`
    );
  }

  // ---- 11. Candidate accepts the sent offer ----
  {
    const { status, body } = await api(
      `/api/candidate/offers/${offerId}/status`,
      {
        method: "PATCH",
        headers: authHeader(candidateToken),
        body: JSON.stringify({ status: "accepted" }),
      }
    );
    assert(
      "Candidate can accept sent offer",
      status === 200 && body?.data?.status === "accepted",
      `status=${status}, offerStatus=${body?.data?.status}`
    );
  }

  // ---- 12. Create another offer for decline test ----
  let offerId2: string;
  {
    const { status, body } = await api(
      `/api/applications/${applicationId}/offers`,
      {
        method: "POST",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({
          salaryMin: 90000,
          salaryMax: 110000,
          currency: "USD",
          message: "Revised offer",
        }),
      }
    );
    assert("Create second offer for decline test", status === 201);
    offerId2 = body?.data?.id;

    // Send it
    await api(`/api/offers/${offerId2}/status`, {
      method: "PATCH",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({ status: "sent" }),
    });
  }

  // ---- 13. Candidate declines the second offer ----
  {
    const { status, body } = await api(
      `/api/candidate/offers/${offerId2}/status`,
      {
        method: "PATCH",
        headers: authHeader(candidateToken),
        body: JSON.stringify({ status: "declined" }),
      }
    );
    assert(
      "Candidate can decline sent offer",
      status === 200 && body?.data?.status === "declined",
      `status=${status}, offerStatus=${body?.data?.status}`
    );
  }

  // ---- 14. Candidate cannot access another application's data ----
  {
    // Use a bogus application ID
    const { status } = await api(
      `/api/candidate/applications/aaaaaaaaaaaaaaaaaaaaaaaa/interviews`,
      { headers: authHeader(candidateToken) }
    );
    assert(
      "Candidate cannot access unknown application (404)",
      status === 404,
      `status=${status}`
    );
  }

  // ---- 15. Candidate cannot set offer status to "sent" ----
  {
    // Create + send another offer
    const createRes = await api(
      `/api/applications/${applicationId}/offers`,
      {
        method: "POST",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({ salaryMin: 70000 }),
      }
    );
    const tempOfferId = createRes.body?.data?.id;
    await api(`/api/offers/${tempOfferId}/status`, {
      method: "PATCH",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({ status: "sent" }),
    });

    // Candidate tries to set it to "sent"
    const { status } = await api(
      `/api/candidate/offers/${tempOfferId}/status`,
      {
        method: "PATCH",
        headers: authHeader(candidateToken),
        body: JSON.stringify({ status: "sent" }),
      }
    );
    assert(
      "Candidate cannot set offer to 'sent' (400)",
      status === 400,
      `status=${status}`
    );
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log("\n" + "=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`\n  Total: ${results.length}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log("  Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) =>
        console.log(`    ❌ ${r.name}${r.detail ? ` — ${r.detail}` : ""}`)
      );
    console.log();
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
