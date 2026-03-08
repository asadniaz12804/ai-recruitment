/**
 * Phase 3 Integration Tests — Jobs CRUD + Public Job Board
 *
 * Prerequisites:
 *   1. MongoDB running
 *   2. Server running on http://localhost:5000
 *   3. Seed data loaded: npx tsx src/scripts/seed.ts
 *
 * Usage:  npx tsx src/scripts/test-phase3.ts
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
  const body = await res.json();
  return { status: res.status, body };
}

async function login(email: string, password: string): Promise<string> {
  const { body } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return body.data.accessToken;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function assert(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition, detail });
  const icon = condition ? "✅" : "❌";
  console.log(
    `  ${icon} ${name}${detail && !condition ? ` — ${detail}` : ""}`
  );
}

async function run() {
  console.log("\n🔧 Phase 3 Integration Tests — Jobs CRUD + Public Board\n");

  // ---- Login ----
  console.log("--- Login ---");
  const adminToken = await login("admin@example.com", "Password123!");
  assert("Admin login", !!adminToken);

  const recruiterToken = await login("recruiter@example.com", "Password123!");
  assert("Recruiter login", !!recruiterToken);

  const candidateToken = await login("candidate@example.com", "Password123!");
  assert("Candidate login", !!candidateToken);

  // ============================================================
  // RECRUITER Creates Jobs
  // ============================================================
  console.log("\n--- Recruiter: Create Jobs ---");

  const { status: createStatus1, body: createBody1 } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "Test Open Job",
      description: "A test open job for Phase 3 integration tests.",
      employmentType: "full-time",
      remote: true,
      location: "Remote",
      seniority: "senior",
      salaryMin: 100000,
      salaryMax: 180000,
      currency: "USD",
      skillsRequired: ["TypeScript", "React", "Node.js"],
      status: "open",
    }),
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter can create open job", createStatus1 === 201, `status=${createStatus1}`);
  const openJobId = createBody1?.data?.id;
  assert("Created job has id", !!openJobId);
  assert(
    "Created job has companyId from recruiter",
    !!createBody1?.data?.companyId,
    `companyId=${createBody1?.data?.companyId}`
  );

  const { status: createStatus2, body: createBody2 } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "Test Draft Job",
      description: "A draft job for testing.",
      employmentType: "contract",
      status: "draft",
    }),
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter can create draft job", createStatus2 === 201, `status=${createStatus2}`);
  const draftJobId = createBody2?.data?.id;

  const { status: createStatus3, body: createBody3 } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "Test Closed Job",
      description: "A closed job for testing.",
      employmentType: "part-time",
      status: "closed",
    }),
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter can create closed job", createStatus3 === 201, `status=${createStatus3}`);
  const closedJobId = createBody3?.data?.id;

  // ---- Candidate cannot create job ----
  console.log("\n--- Candidate: Cannot Create Job ---");
  const { status: candCreateStatus } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "Should Fail",
      description: "This should not work.",
      employmentType: "full-time",
    }),
    headers: authHeader(candidateToken),
  });
  assert("Candidate cannot create job", candCreateStatus === 403, `status=${candCreateStatus}`);

  // ---- Unauthenticated cannot create job ----
  const { status: anonCreateStatus } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "Anon Job",
      description: "Fail.",
      employmentType: "full-time",
    }),
  });
  assert("Anonymous cannot create job", anonCreateStatus === 401, `status=${anonCreateStatus}`);

  // ============================================================
  // PUBLIC Job Board
  // ============================================================
  console.log("\n--- Public Job Board ---");

  const { status: publicListStatus, body: publicListBody } = await api(
    "/api/jobs"
  );
  assert("Public job list returns 200", publicListStatus === 200, `status=${publicListStatus}`);
  assert(
    "Public job list has pagination",
    !!publicListBody?.data?.pagination,
    JSON.stringify(publicListBody?.data?.pagination)
  );
  assert(
    "Public job list has items array",
    Array.isArray(publicListBody?.data?.items)
  );

  // Only open jobs visible publicly
  const publicItems: any[] = publicListBody?.data?.items ?? [];
  const allOpen = publicItems.every((j: any) => j.status === "open");
  assert("Public list shows only open jobs", allOpen);

  // Our open job should be in the list
  const foundOpen = publicItems.some((j: any) => j.id === openJobId);
  assert("Open job appears in public list", foundOpen);

  // Draft job should NOT be in public list
  const foundDraft = publicItems.some((j: any) => j.id === draftJobId);
  assert("Draft job NOT in public list", !foundDraft);

  // Closed job should NOT be in public list
  const foundClosed = publicItems.some((j: any) => j.id === closedJobId);
  assert("Closed job NOT in public list", !foundClosed);

  // ---- Search ----
  console.log("\n--- Public: Search & Filter ---");
  const { status: searchStatus, body: searchBody } = await api(
    "/api/jobs?q=Test+Open"
  );
  assert("Search returns 200", searchStatus === 200, `status=${searchStatus}`);
  const searchItems: any[] = searchBody?.data?.items ?? [];
  const foundBySearch = searchItems.some((j: any) => j.id === openJobId);
  assert("Search finds our open job", foundBySearch);

  // ---- Filter by employment type ----
  const { status: filterStatus, body: filterBody } = await api(
    "/api/jobs?employmentType=full-time"
  );
  assert("Filter by employmentType returns 200", filterStatus === 200, `status=${filterStatus}`);
  const filterItems: any[] = filterBody?.data?.items ?? [];
  const allFullTime = filterItems.every(
    (j: any) => j.employmentType === "full-time"
  );
  assert("Filtered jobs are all full-time", allFullTime || filterItems.length === 0);

  // ---- Pagination ----
  const { status: pagStatus, body: pagBody } = await api(
    "/api/jobs?limit=1&page=1"
  );
  assert("Paginated request returns 200", pagStatus === 200, `status=${pagStatus}`);
  assert(
    "Pagination limit works",
    (pagBody?.data?.items?.length ?? 0) <= 1,
    `items=${pagBody?.data?.items?.length}`
  );
  assert(
    "Pagination meta has totalPages",
    typeof pagBody?.data?.pagination?.totalPages === "number"
  );

  // ============================================================
  // PUBLIC Get Job by ID
  // ============================================================
  console.log("\n--- Public: Get Job By ID ---");

  // Open job — accessible without auth
  const { status: getOpenStatus, body: getOpenBody } = await api(
    `/api/jobs/${openJobId}`
  );
  assert("Public can get open job", getOpenStatus === 200, `status=${getOpenStatus}`);
  assert("Returned job has correct title", getOpenBody?.data?.title === "Test Open Job");

  // Draft job — NOT accessible without auth (returns 404)
  const { status: getDraftAnonStatus } = await api(`/api/jobs/${draftJobId}`);
  assert(
    "Anonymous cannot get draft job (404)",
    getDraftAnonStatus === 404,
    `status=${getDraftAnonStatus}`
  );

  // Closed job — NOT accessible without auth (returns 404)
  const { status: getClosedAnonStatus } = await api(`/api/jobs/${closedJobId}`);
  assert(
    "Anonymous cannot get closed job (404)",
    getClosedAnonStatus === 404,
    `status=${getClosedAnonStatus}`
  );

  // Draft job — accessible by recruiter who owns it
  const { status: getDraftRecStatus } = await api(`/api/jobs/${draftJobId}`, {
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter can get own draft job", getDraftRecStatus === 200, `status=${getDraftRecStatus}`);

  // Draft job — accessible by admin
  const { status: getDraftAdminStatus } = await api(`/api/jobs/${draftJobId}`, {
    headers: authHeader(adminToken),
  });
  assert("Admin can get any draft job", getDraftAdminStatus === 200, `status=${getDraftAdminStatus}`);

  // ============================================================
  // RECRUITER: List Own Jobs
  // ============================================================
  console.log("\n--- Recruiter: List Own Jobs ---");

  const { status: recListStatus, body: recListBody } = await api(
    "/api/recruiter/jobs",
    { headers: authHeader(recruiterToken) }
  );
  assert("Recruiter can list own jobs", recListStatus === 200, `status=${recListStatus}`);
  const recItems: any[] = recListBody?.data?.items ?? [];
  assert("Recruiter list includes jobs", recItems.length >= 3);
  const hasOpenInRec = recItems.some((j: any) => j.id === openJobId);
  const hasDraftInRec = recItems.some((j: any) => j.id === draftJobId);
  const hasClosedInRec = recItems.some((j: any) => j.id === closedJobId);
  assert("Recruiter sees open job", hasOpenInRec);
  assert("Recruiter sees draft job", hasDraftInRec);
  assert("Recruiter sees closed job", hasClosedInRec);

  // ---- Recruiter list with status filter ----
  const { status: recDraftStatus, body: recDraftBody } = await api(
    "/api/recruiter/jobs?status=draft",
    { headers: authHeader(recruiterToken) }
  );
  assert("Recruiter filter by draft", recDraftStatus === 200, `status=${recDraftStatus}`);
  const draftItems: any[] = recDraftBody?.data?.items ?? [];
  const allDraft = draftItems.every((j: any) => j.status === "draft");
  assert("Filtered recruiter list shows only drafts", allDraft);

  // Candidate cannot list recruiter jobs
  const { status: candRecListStatus } = await api("/api/recruiter/jobs", {
    headers: authHeader(candidateToken),
  });
  assert("Candidate cannot list recruiter jobs", candRecListStatus === 403, `status=${candRecListStatus}`);

  // ============================================================
  // Update Job
  // ============================================================
  console.log("\n--- Recruiter: Update Job ---");

  const { status: updateStatus, body: updateBody } = await api(
    `/api/jobs/${openJobId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated Open Job" }),
      headers: authHeader(recruiterToken),
    }
  );
  assert("Recruiter can update own job", updateStatus === 200, `status=${updateStatus}`);
  assert(
    "Updated title is correct",
    updateBody?.data?.title === "Updated Open Job"
  );

  // Candidate cannot update
  const { status: candUpdateStatus } = await api(`/api/jobs/${openJobId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "Hacked" }),
    headers: authHeader(candidateToken),
  });
  assert(
    "Candidate cannot update job (403 or 404)",
    candUpdateStatus === 403 || candUpdateStatus === 404,
    `status=${candUpdateStatus}`
  );

  // Admin can update any job
  const { status: adminUpdateStatus } = await api(`/api/jobs/${openJobId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "Admin Updated Job" }),
    headers: authHeader(adminToken),
  });
  assert("Admin can update any job", adminUpdateStatus === 200, `status=${adminUpdateStatus}`);

  // ============================================================
  // Delete Job
  // ============================================================
  console.log("\n--- Recruiter: Delete Job ---");

  // Candidate cannot delete
  const { status: candDeleteStatus } = await api(`/api/jobs/${closedJobId}`, {
    method: "DELETE",
    headers: authHeader(candidateToken),
  });
  assert(
    "Candidate cannot delete job",
    candDeleteStatus === 403 || candDeleteStatus === 404,
    `status=${candDeleteStatus}`
  );

  // Recruiter deletes closed job
  const { status: deleteStatus } = await api(`/api/jobs/${closedJobId}`, {
    method: "DELETE",
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter can delete own job", deleteStatus === 200, `status=${deleteStatus}`);

  // Verify deleted job is gone
  const { status: getDeletedStatus } = await api(`/api/jobs/${closedJobId}`);
  assert(
    "Deleted job returns 404",
    getDeletedStatus === 404,
    `status=${getDeletedStatus}`
  );

  // Admin deletes draft job
  const { status: adminDeleteStatus } = await api(`/api/jobs/${draftJobId}`, {
    method: "DELETE",
    headers: authHeader(adminToken),
  });
  assert("Admin can delete any job", adminDeleteStatus === 200, `status=${adminDeleteStatus}`);

  // Cleanup: delete the remaining open job
  await api(`/api/jobs/${openJobId}`, {
    method: "DELETE",
    headers: authHeader(adminToken),
  });

  // ============================================================
  // Validation Tests
  // ============================================================
  console.log("\n--- Validation ---");

  const { status: badCreateStatus } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ title: "" }),
    headers: authHeader(recruiterToken),
  });
  assert(
    "Empty title rejected",
    badCreateStatus === 400 || badCreateStatus === 422,
    `status=${badCreateStatus}`
  );

  const { status: badTypeStatus } = await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "A",
      description: "B",
      employmentType: "banana",
    }),
    headers: authHeader(recruiterToken),
  });
  assert(
    "Invalid employmentType rejected",
    badTypeStatus === 400 || badTypeStatus === 422,
    `status=${badTypeStatus}`
  );

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
    console.log("\n🎉 All Phase 3 tests passed!\n");
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
