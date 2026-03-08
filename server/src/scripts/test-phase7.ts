/**
 * Phase 7 Integration Tests — Background Jobs + AI Integration
 *
 * Prerequisites:
 *   1. MongoDB running (docker)
 *   2. Server running on http://localhost:5000
 *   3. Seed data loaded: npx tsx src/scripts/seed.ts
 *
 * These tests run against the HTTP API and verify that:
 *   - Resume upload still succeeds (with & without AI)
 *   - Application creation still succeeds (with & without AI)
 *   - Application responses include matchScore + aiSummary fields
 *   - Admin queue-health endpoint works
 *   - parseStatus is returned on candidate resume list
 *
 * Note: The server should be started with AI_ENABLED=false for the first
 * run of these tests (no Redis/BullMQ dependency). With AI_ENABLED=true
 * and Redis running, the queue-health endpoint returns live counts.
 *
 * Usage:  npx tsx src/scripts/test-phase7.ts
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

async function apiRaw(
  path: string,
  opts: RequestInit = {}
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, opts);
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
  console.log(`  ${icon} ${name}${detail && !passed ? ` — ${detail}` : ""}`);
}

// ================================================================
// TESTS
// ================================================================

async function run() {
  console.log("\n🔬 Phase 7 Integration Tests — Background Jobs + AI\n");

  // ---- Login ----
  let recruiterToken: string;
  let candidateToken: string;
  let adminToken: string;

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

  // ============================================================
  // 1. Resume upload still works (no AI crash)
  // ============================================================
  console.log("\n--- Resume Upload (graceful without AI) ---");

  // Ensure candidate profile exists first
  const { status: profStatus } = await api("/api/candidates/me/profile", {
    method: "PUT",
    headers: authHeader(candidateToken),
    body: JSON.stringify({
      headline: "Phase 7 Test Candidate",
      summary: "Testing background jobs integration",
      skills: ["TypeScript", "Node.js", "React"],
      experienceYears: 3,
    }),
  });
  assert("Create/update candidate profile", profStatus === 200, `status=${profStatus}`);

  // Upload a small fake PDF as a "resume"
  const fakeResume = new Blob(
    ["%PDF-1.4 fake resume content for testing"],
    { type: "application/pdf" }
  );
  const fd = new FormData();
  fd.append("file", fakeResume, "phase7-test-resume.pdf");

  const { status: uploadStatus, body: uploadBody } = await apiRaw("/api/resumes/upload", {
    method: "POST",
    headers: authHeader(candidateToken),
    body: fd,
  });
  assert("Resume upload returns 201", uploadStatus === 201, `status=${uploadStatus}`);
  const resumeId = uploadBody?.data?.id ?? uploadBody?.data?._id;
  assert("Resume ID returned", !!resumeId, `id=${resumeId}`);

  // Check that the resume has parseStatus field
  const { status: resumeListSt, body: resumeListBody } = await api("/api/resumes/me", {
    headers: authHeader(candidateToken),
  });
  assert("Candidate can list resumes", resumeListSt === 200, `status=${resumeListSt}`);

  const resumes = resumeListBody?.data ?? [];
  const ourResume = resumes.find((r: any) => r.id === resumeId || r._id === resumeId);
  assert(
    "Resume has parseStatus field",
    ourResume && typeof ourResume.parseStatus === "string",
    `parseStatus=${ourResume?.parseStatus}`
  );

  // ============================================================
  // 2. Application creation still works (no AI crash)
  // ============================================================
  console.log("\n--- Application Creation (graceful without AI) ---");

  // Create a fresh job for testing
  const uniqueSuffix = Date.now().toString(36);
  const { status: jobCreateSt, body: jobCreateBody } = await api("/api/jobs", {
    method: "POST",
    headers: authHeader(recruiterToken),
    body: JSON.stringify({
      title: `AI Test Job ${uniqueSuffix}`,
      description: "A job to test Phase 7 AI scoring integration",
      type: "full-time",
      location: "Remote",
      skillsRequired: ["TypeScript", "React"],
    }),
  });
  assert("Recruiter creates test job", jobCreateSt === 201, `status=${jobCreateSt}`);
  const jobId = jobCreateBody?.data?.id ?? jobCreateBody?.data?._id;

  // Publish the job
  if (jobId) {
    await api(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({ status: "open" }),
    });
  }

  // Candidate applies
  const { status: applySt, body: applyBody } = await api(
    `/api/jobs/${jobId}/apply`,
    {
      method: "POST",
      headers: authHeader(candidateToken),
      body: JSON.stringify({}),
    }
  );
  assert("Candidate can apply", applySt === 201, `status=${applySt}`);
  const applicationId = applyBody?.data?.id ?? applyBody?.data?._id;
  assert("Application ID returned", !!applicationId, `id=${applicationId}`);

  // ============================================================
  // 3. Recruiter list includes matchScore + aiSummary structure
  // ============================================================
  console.log("\n--- Recruiter Application List (AI fields) ---");

  const { status: recruiterListSt, body: recruiterListBody } = await api(
    `/api/recruiter/jobs/${jobId}/applications`,
    { headers: authHeader(recruiterToken) }
  );
  assert("Recruiter list returns 200", recruiterListSt === 200, `status=${recruiterListSt}`);

  const items = recruiterListBody?.data?.items ?? recruiterListBody?.data ?? [];
  const ourApp = items.find(
    (a: any) => (a.id === applicationId || a._id === applicationId)
  );

  if (ourApp) {
    // matchScore and aiSummary should exist as keys (may be null when AI disabled)
    assert(
      "Application has matchScore key",
      "matchScore" in ourApp,
      `keys=${Object.keys(ourApp).join(",")}`
    );
    assert(
      "Application has aiSummary key",
      "aiSummary" in ourApp,
      `keys=${Object.keys(ourApp).join(",")}`
    );
  } else {
    assert("Application found in recruiter list", false, "not found");
  }

  // ============================================================
  // 4. Candidate can view own application with AI fields
  // ============================================================
  console.log("\n--- Candidate Own Application ---");

  const { status: candAppSt, body: candAppBody } = await api(
    "/api/applications/me",
    { headers: authHeader(candidateToken) }
  );
  assert("Candidate list applications", candAppSt === 200, `status=${candAppSt}`);

  const candApps = candAppBody?.data?.items ?? candAppBody?.data ?? [];
  assert("Candidate has at least one application", candApps.length > 0);

  // ============================================================
  // 5. Admin Queue Health endpoint
  // ============================================================
  console.log("\n--- Admin Queue Health ---");

  const { status: queueSt, body: queueBody } = await api(
    "/api/admin/queues/health",
    { headers: authHeader(adminToken) }
  );
  assert("Admin queue-health returns 200", queueSt === 200, `status=${queueSt}`);
  assert(
    "Queue health has aiEnabled field",
    queueBody?.data && typeof queueBody.data.aiEnabled === "boolean",
    `aiEnabled=${queueBody?.data?.aiEnabled}`
  );

  if (queueBody?.data?.aiEnabled) {
    assert(
      "Queue health has resumeParse counts",
      queueBody.data.resumeParse != null,
      JSON.stringify(queueBody.data.resumeParse)
    );
    assert(
      "Queue health has applicationScore counts",
      queueBody.data.applicationScore != null,
      JSON.stringify(queueBody.data.applicationScore)
    );
  } else {
    assert("AI disabled — no queue counts expected", true);
  }

  // ============================================================
  // 6. Non-admin cannot access queue health
  // ============================================================
  console.log("\n--- Queue Health Access Control ---");

  const { status: recQueueSt } = await api("/api/admin/queues/health", {
    headers: authHeader(recruiterToken),
  });
  assert(
    "Recruiter cannot access queue-health",
    recQueueSt === 403,
    `status=${recQueueSt}`
  );

  const { status: candQueueSt } = await api("/api/admin/queues/health", {
    headers: authHeader(candidateToken),
  });
  assert(
    "Candidate cannot access queue-health",
    candQueueSt === 403,
    `status=${candQueueSt}`
  );

  // ============================================================
  // 7. Duplicate application still rejected
  // ============================================================
  console.log("\n--- Duplicate Application Guard ---");

  const { status: dupSt } = await api(`/api/jobs/${jobId}/apply`, {
    method: "POST",
    headers: authHeader(candidateToken),
    body: JSON.stringify({}),
  });
  assert("Duplicate application returns 409", dupSt === 409, `status=${dupSt}`);

  // ============================================================
  // 8. Clean up — close the test job
  // ============================================================
  console.log("\n--- Cleanup ---");
  if (jobId) {
    const { status: closeSt } = await api(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: authHeader(recruiterToken),
      body: JSON.stringify({ status: "closed" }),
    });
    assert("Close test job", closeSt === 200, `status=${closeSt}`);
  }

  // ---- Summary ----
  console.log("\n═══════════════════════════════════════");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(
    `Results: ${passed} passed, ${failed} failed out of ${results.length} tests`
  );
  if (failed > 0) {
    console.log("\nFailed:");
    results
      .filter((r) => !r.passed)
      .forEach((r) =>
        console.log(`  ❌ ${r.name} ${r.detail ? `— ${r.detail}` : ""}`)
      );
    process.exit(1);
  } else {
    console.log("\n🎉 All Phase 7 tests passed!\n");
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
