/**
 * Phase 2 Integration Tests
 *
 * Prerequisites:
 *   1. MongoDB running
 *   2. Server running on http://localhost:5000
 *   3. Seed data loaded: npx tsx src/scripts/seed.ts
 *
 * Usage:  npx tsx src/scripts/test-phase2.ts
 */

const BASE = process.env.API_BASE ?? "http://localhost:5000";

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: TestResult[] = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
async function api(path: string, opts: RequestInit = {}): Promise<{ status: number; body: any }> {
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

function assert(
  name: string,
  condition: boolean,
  detail?: string
) {
  results.push({ name, passed: condition, detail });
  const icon = condition ? "✅" : "❌";
  console.log(`  ${icon} ${name}${detail && !condition ? ` — ${detail}` : ""}`);
}

async function run() {
  console.log("\n🔧 Phase 2 Integration Tests\n");

  // ---- Login as each role ----
  console.log("--- Login ---");
  const adminToken = await login("admin@example.com", "Password123!");
  assert("Admin login", !!adminToken);

  const recruiterToken = await login("recruiter@example.com", "Password123!");
  assert("Recruiter login", !!recruiterToken);

  const candidateToken = await login("candidate@example.com", "Password123!");
  assert("Candidate login", !!candidateToken);

  // ---- Admin creates a company ----
  console.log("\n--- Company: Create ---");
  const { status: ccStatus, body: ccBody } = await api("/api/companies", {
    method: "POST",
    body: JSON.stringify({ name: "Test Co", website: "https://test.co" }),
    headers: authHeader(adminToken),
  });
  assert("Admin can create company", ccStatus === 201, `status=${ccStatus}`);
  const testCompanyId = ccBody?.data?.id;

  // Recruiter creates a company
  const { status: rcStatus } = await api("/api/companies", {
    method: "POST",
    body: JSON.stringify({ name: "Recruiter Co" }),
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter can create company", rcStatus === 201, `status=${rcStatus}`);

  // Candidate cannot create company
  const { status: candCcStatus } = await api("/api/companies", {
    method: "POST",
    body: JSON.stringify({ name: "Nope Co" }),
    headers: authHeader(candidateToken),
  });
  assert("Candidate cannot create company", candCcStatus === 403, `status=${candCcStatus}`);

  // ---- Company: Read ----
  console.log("\n--- Company: Read ---");
  // Admin can read any company
  const { status: readStatus } = await api(`/api/companies/${testCompanyId}`, {
    headers: authHeader(adminToken),
  });
  assert("Admin can read any company", readStatus === 200, `status=${readStatus}`);

  // Recruiter was auto-assigned recruiterCompanyId (if they had no companyId before,
  // but seed gives them Acme Corp). Let's verify they can read *their* company.
  // Try reading the recruiterCompanyId they just created — this may have been
  // auto-assigned to them, but they already had Acme Corp from seed, so they
  // should be able to read Acme Corp.
  const { status: recReadOther } = await api(`/api/companies/${testCompanyId}`, {
    headers: authHeader(recruiterToken),
  });
  assert(
    "Recruiter cannot read another company",
    recReadOther === 403,
    `status=${recReadOther}`
  );

  // Candidate cannot read company
  const { status: candReadStatus } = await api(`/api/companies/${testCompanyId}`, {
    headers: authHeader(candidateToken),
  });
  assert("Candidate cannot read company", candReadStatus === 403, `status=${candReadStatus}`);

  // ---- Admin: List users ----
  console.log("\n--- Admin: List Users ---");
  const { status: luStatus, body: luBody } = await api("/api/admin/users", {
    headers: authHeader(adminToken),
  });
  assert("Admin can list users", luStatus === 200, `status=${luStatus}`);
  assert(
    "User list is paginated",
    luBody?.data?.pagination !== undefined
  );
  assert(
    "User list has items",
    Array.isArray(luBody?.data?.items) && luBody.data.items.length > 0
  );
  // Verify passwordHash is not exposed
  const hasPasswordHash = luBody?.data?.items?.some(
    (u: Record<string, unknown>) => u.passwordHash !== undefined
  );
  assert("User list omits passwordHash", !hasPasswordHash);

  // Non-admin cannot list users
  const { status: recLuStatus } = await api("/api/admin/users", {
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter cannot list users", recLuStatus === 403, `status=${recLuStatus}`);

  const { status: candLuStatus } = await api("/api/admin/users", {
    headers: authHeader(candidateToken),
  });
  assert("Candidate cannot list users", candLuStatus === 403, `status=${candLuStatus}`);

  // ---- Admin: Update user role/company ----
  console.log("\n--- Admin: Patch User ---");
  // Find candidate user
  const candidateUser = luBody?.data?.items?.find(
    (u: Record<string, unknown>) => u.email === "candidate@example.com"
  );

  if (candidateUser) {
    // Promote candidate to recruiter and assign company
    const { status: patchStatus, body: patchBody } = await api(
      `/api/admin/users/${candidateUser.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          role: "recruiter",
          companyId: testCompanyId,
        }),
        headers: authHeader(adminToken),
      }
    );
    assert(
      "Admin can patch user role/companyId",
      patchStatus === 200,
      `status=${patchStatus}`
    );
    assert(
      "Updated user has recruiter role",
      patchBody?.data?.user?.role === "recruiter"
    );
    assert(
      "Updated user has companyId assigned",
      patchBody?.data?.user?.companyId === testCompanyId
    );

    // Revert candidate back
    await api(`/api/admin/users/${candidateUser.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: "candidate", companyId: null }),
      headers: authHeader(adminToken),
    });
  } else {
    assert("Find candidate user for patch test", false, "candidate@example.com not found");
  }

  // Non-admin cannot patch users
  const { status: recPatchStatus } = await api(
    `/api/admin/users/${candidateUser?.id ?? "000000000000000000000000"}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role: "admin" }),
      headers: authHeader(recruiterToken),
    }
  );
  assert("Recruiter cannot patch users", recPatchStatus === 403, `status=${recPatchStatus}`);

  // ---- Summary ----
  console.log("\n═══════════════════════════════════════");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  if (failed > 0) {
    console.log("\nFailed:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  ❌ ${r.name} ${r.detail ? `— ${r.detail}` : ""}`));
    process.exit(1);
  } else {
    console.log("\n🎉 All Phase 2 tests passed!\n");
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
