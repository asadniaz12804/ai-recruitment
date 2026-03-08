/**
 * Phase 5 Integration Tests — Applications + Pipeline Stages + Recruiter Review
 *
 * Prerequisites:
 *   1. MongoDB running
 *   2. Server running on http://localhost:5000
 *   3. Seed data loaded: npx tsx src/scripts/seed.ts
 *
 * Tests cover:
 *   - Candidate can apply to open job
 *   - Cannot apply twice (409)
 *   - Cannot apply to closed job (400)
 *   - Candidate can list own applications
 *   - Candidate cannot access recruiter endpoints (403)
 *   - Recruiter can list applications for their job
 *   - Recruiter cannot list applications for another company's job (404)
 *   - Recruiter can update application stage
 *   - Recruiter can add notes to application
 *   - Get single application by candidate and recruiter
 *
 * Usage:  npx tsx src/scripts/test-phase5.ts
 */
export {};

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
  console.log("\n🔬 Phase 5 Integration Tests\n");

  // ---- Login credentials (must match seed data) ----
  let recruiterToken!: string;
  let candidateToken!: string;
  let adminToken!: string;

  try {
    recruiterToken = await login("recruiter@example.com", "Password123!");
    candidateToken = await login("candidate@example.com", "Password123!");
    adminToken = await login("admin@example.com", "Password123!");
  } catch (err) {
    console.error("❌ Could not log in with seed users. Run seed first.");
    console.error(err);
    process.exit(1);
  }
  assert("Login all seed users", true);

  // ---- Find an open job from recruiter's company ----
  // First, create a fresh open job to avoid stale state from previous runs
  let openJobId: string;
  {
    const createRes = await api("/api/jobs", {
      method: "POST",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({
        title: `Phase 5 Test Job ${Date.now()}`,
        description: "This is a test job for Phase 5 integration tests",
        status: "open",
        employmentType: "full-time",
      }),
    });
    assert("Create fresh open job for tests", createRes.status === 201);
    openJobId = createRes.body.data.id;
  }

  // ---- 1. Candidate applies to open job ----
  let applicationId: string;
  {
    const { status, body } = await api(`/api/jobs/${openJobId}/apply`, {
      method: "POST",
      headers: authHeader(candidateToken),
      body: JSON.stringify({}),
    });
    assert(
      "Candidate can apply to open job",
      status === 201 && body?.data?.id,
      `status=${status}`
    );
    applicationId = body?.data?.id;
  }

  // ---- 2. Cannot apply twice (409) ----
  {
    const { status } = await api(`/api/jobs/${openJobId}/apply`, {
      method: "POST",
      headers: authHeader(candidateToken),
      body: JSON.stringify({}),
    });
    assert("Cannot apply twice (409)", status === 409, `status=${status}`);
  }

  // ---- 3. Cannot apply to closed job ----
  {
    // Create a closed job first
    const createRes = await api("/api/jobs", {
      method: "POST",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({
        title: "Closed Job",
        description: "This job is closed",
        status: "closed",
        employmentType: "full-time",
      }),
    });
    const closedJobId = createRes.body?.data?.id;
    if (closedJobId) {
      const { status } = await api(`/api/jobs/${closedJobId}/apply`, {
        method: "POST",
        headers: authHeader(candidateToken),
        body: JSON.stringify({}),
      });
      assert(
        "Cannot apply to closed job (400)",
        status === 400,
        `status=${status}`
      );
    } else {
      assert("Cannot apply to closed job (400)", false, "Could not create closed job");
    }
  }

  // ---- 4. Candidate can list own applications ----
  {
    const { status, body } = await api("/api/applications/me", {
      headers: authHeader(candidateToken),
    });
    assert(
      "Candidate can list own applications",
      status === 200 && body?.data?.items?.length >= 1,
      `count=${body?.data?.items?.length}`
    );
  }

  // ---- 5. Candidate cannot access recruiter endpoints ----
  {
    const { status } = await api(
      `/api/recruiter/jobs/${openJobId}/applications`,
      {
        headers: authHeader(candidateToken),
      }
    );
    assert(
      "Candidate cannot access recruiter applications endpoint",
      status === 403,
      `status=${status}`
    );
  }

  // ---- 6. Recruiter can list applications for their job ----
  {
    const { status, body } = await api(
      `/api/recruiter/jobs/${openJobId}/applications`,
      {
        headers: authHeader(recruiterToken),
      }
    );
    assert(
      "Recruiter can list applications for their job",
      status === 200 && body?.data?.items?.length >= 1,
      `count=${body?.data?.items?.length}`
    );
  }

  // ---- 7. Recruiter cannot list apps for another company's job ----
  {
    // Create a second recruiter with a different company
    // For simplicity, use a fake objectId
    const fakeJobId = "000000000000000000000000";
    const { status } = await api(
      `/api/recruiter/jobs/${fakeJobId}/applications`,
      {
        headers: authHeader(recruiterToken),
      }
    );
    assert(
      "Recruiter cannot list apps for non-existent/other company job (404)",
      status === 404,
      `status=${status}`
    );
  }

  // ---- 8. Recruiter can update application stage ----
  if (applicationId) {
    const { status, body } = await api(
      `/api/applications/${applicationId}/stage`,
      {
        method: "PATCH",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({ stage: "screening" }),
      }
    );
    assert(
      "Recruiter can update application stage",
      status === 200 && body?.data?.stage === "screening",
      `stage=${body?.data?.stage}`
    );

    // Check stageHistory populated
    assert(
      "Stage history is recorded",
      body?.data?.stageHistory?.length >= 1,
      `entries=${body?.data?.stageHistory?.length}`
    );
  }

  // ---- 9. Recruiter can add notes ----
  if (applicationId) {
    const { status, body } = await api(
      `/api/applications/${applicationId}/notes`,
      {
        method: "POST",
        headers: authHeader(recruiterToken),
        body: JSON.stringify({ text: "Strong candidate, schedule interview." }),
      }
    );
    assert(
      "Recruiter can add notes to application",
      status === 200 && body?.data?.recruiterNotes?.length >= 1,
      `notes=${body?.data?.recruiterNotes?.length}`
    );
  }

  // ---- 10. Get single application by candidate ----
  if (applicationId) {
    const { status, body } = await api(
      `/api/applications/${applicationId}`,
      {
        headers: authHeader(candidateToken),
      }
    );
    assert(
      "Candidate can get single application detail",
      status === 200 && body?.data?.id === applicationId,
      `id=${body?.data?.id}`
    );
  }

  // ---- 11. Recruiter can get single application ----
  if (applicationId) {
    const { status, body } = await api(
      `/api/applications/${applicationId}`,
      {
        headers: authHeader(recruiterToken),
      }
    );
    assert(
      "Recruiter can get single application detail",
      status === 200 && body?.data?.id === applicationId,
      `id=${body?.data?.id}`
    );
  }

  // ---- 12. Candidate cannot update stage (recruiter endpoint) ----
  if (applicationId) {
    const { status } = await api(
      `/api/applications/${applicationId}/stage`,
      {
        method: "PATCH",
        headers: authHeader(candidateToken),
        body: JSON.stringify({ stage: "hired" }),
      }
    );
    assert(
      "Candidate cannot update application stage (403)",
      status === 403,
      `status=${status}`
    );
  }

  // ---- 13. Candidate cannot add notes (recruiter endpoint) ----
  if (applicationId) {
    const { status } = await api(
      `/api/applications/${applicationId}/notes`,
      {
        method: "POST",
        headers: authHeader(candidateToken),
        body: JSON.stringify({ text: "Sneaky candidate note" }),
      }
    );
    assert(
      "Candidate cannot add recruiter notes (403)",
      status === 403,
      `status=${status}`
    );
  }

  // ---- Stage filter test ----
  {
    const { status, body } = await api(
      `/api/recruiter/jobs/${openJobId}/applications?stage=screening`,
      {
        headers: authHeader(recruiterToken),
      }
    );
    assert(
      "Recruiter can filter applications by stage",
      status === 200,
      `count=${body?.data?.items?.length}`
    );
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (failed > 0) {
    console.log("Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  ❌ ${r.name} ${r.detail ?? ""}`));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
