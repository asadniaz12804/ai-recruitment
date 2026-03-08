/**
 * Phase 4 Integration Tests — Candidate Profile + Resume Upload
 *
 * Prerequisites:
 *   1. MongoDB running
 *   2. Server running on http://localhost:5000
 *   3. Seed data loaded: npx tsx src/scripts/seed.ts
 *
 * Note: Resume upload tests use the storage adapter. If Cloudinary env vars
 * are not set, the FakeStorageService is used automatically — tests still pass.
 *
 * Usage:  npx tsx src/scripts/test-phase4.ts
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

// Multipart helper — build a multipart/form-data body manually (Node 18+ fetch)
function buildMultipart(
  fieldName: string,
  fileName: string,
  content: Buffer | Uint8Array,
  mimeType: string
): { body: FormData } {
  const fd = new FormData();
  const blob = new Blob([content], { type: mimeType });
  fd.append(fieldName, blob, fileName);
  return { body: fd };
}

async function run() {
  console.log("\n🔧 Phase 4 Integration Tests — Candidate Profile + Resumes\n");

  // ---- Login ----
  console.log("--- Login ---");
  const adminToken = await login("admin@example.com", "Password123!");
  assert("Admin login", !!adminToken);

  const recruiterToken = await login("recruiter@example.com", "Password123!");
  assert("Recruiter login", !!recruiterToken);

  const candidateToken = await login("candidate@example.com", "Password123!");
  assert("Candidate login", !!candidateToken);

  // ============================================================
  // Candidate Profile
  // ============================================================
  console.log("\n--- Candidate Profile: GET (auto-create) ---");

  const { status: getProfileStatus, body: getProfileBody } = await api(
    "/api/candidates/me/profile",
    { headers: authHeader(candidateToken) }
  );
  assert("Candidate can GET profile", getProfileStatus === 200, `status=${getProfileStatus}`);
  assert(
    "Profile has userId",
    !!getProfileBody?.data?.userId
  );
  assert(
    "Profile auto-created with empty skills",
    Array.isArray(getProfileBody?.data?.skills)
  );

  // ---- Recruiter cannot access candidate profile ----
  console.log("\n--- Authorization: Recruiter/Admin blocked ---");
  const { status: recProfStatus } = await api("/api/candidates/me/profile", {
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter cannot GET candidate profile", recProfStatus === 403, `status=${recProfStatus}`);

  const { status: adminProfStatus } = await api("/api/candidates/me/profile", {
    headers: authHeader(adminToken),
  });
  assert("Admin cannot GET candidate profile", adminProfStatus === 403, `status=${adminProfStatus}`);

  // ---- Update profile ----
  console.log("\n--- Candidate Profile: PUT (upsert) ---");
  const { status: putStatus, body: putBody } = await api(
    "/api/candidates/me/profile",
    {
      method: "PUT",
      body: JSON.stringify({
        headline: "Senior React Developer",
        summary: "I build great UIs.",
        skills: ["React", "TypeScript", "Node.js"],
        yearsExperience: 5,
        location: "New York, NY",
        links: {
          linkedin: "https://linkedin.com/in/testcandidate",
          github: "https://github.com/testcandidate",
          portfolio: "https://testcandidate.dev",
        },
      }),
      headers: authHeader(candidateToken),
    }
  );
  assert("Candidate can PUT profile", putStatus === 200, `status=${putStatus}`);
  assert(
    "Updated headline correct",
    putBody?.data?.headline === "Senior React Developer"
  );
  assert(
    "Updated skills correct",
    putBody?.data?.skills?.length === 3
  );
  assert(
    "Updated yearsExperience correct",
    putBody?.data?.yearsExperience === 5
  );
  assert(
    "Updated links correct",
    putBody?.data?.links?.github === "https://github.com/testcandidate"
  );

  // ---- Recruiter cannot PUT candidate profile ----
  const { status: recPutStatus } = await api("/api/candidates/me/profile", {
    method: "PUT",
    body: JSON.stringify({ headline: "Hacked" }),
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter cannot PUT candidate profile", recPutStatus === 403, `status=${recPutStatus}`);

  // ---- Re-read to verify persistence ----
  const { status: reReadStatus, body: reReadBody } = await api(
    "/api/candidates/me/profile",
    { headers: authHeader(candidateToken) }
  );
  assert("Re-read profile returns 200", reReadStatus === 200, `status=${reReadStatus}`);
  assert(
    "Persisted headline matches",
    reReadBody?.data?.headline === "Senior React Developer"
  );

  // ============================================================
  // Resume Upload
  // ============================================================
  console.log("\n--- Resume Upload ---");

  // Create a minimal fake PDF (just the header bytes + some content)
  const fakePdfContent = Buffer.from(
    "%PDF-1.4 fake content for testing purposes\n%%EOF"
  );

  const { body: uploadForm } = buildMultipart(
    "file",
    "my-resume.pdf",
    fakePdfContent,
    "application/pdf"
  );

  const uploadRes = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(candidateToken),
    body: uploadForm,
  });
  const uploadBody = await uploadRes.json();
  assert("Candidate can upload resume", uploadRes.status === 201, `status=${uploadRes.status}`);
  assert("Upload returns resume record", !!uploadBody?.data?.id);
  assert(
    "Upload has originalFileName",
    uploadBody?.data?.originalFileName === "my-resume.pdf"
  );
  assert(
    "Upload has url",
    typeof uploadBody?.data?.url === "string" && uploadBody.data.url.length > 0
  );
  assert(
    "Upload parseStatus is pending",
    uploadBody?.data?.parseStatus === "pending"
  );

  // ---- Upload a second resume (DOCX) ----
  const fakeDocx = Buffer.from("PK\x03\x04 fake docx content");
  const { body: docxForm } = buildMultipart(
    "file",
    "resume-v2.docx",
    fakeDocx,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  const docxRes = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(candidateToken),
    body: docxForm,
  });
  assert("Candidate can upload DOCX", docxRes.status === 201, `status=${docxRes.status}`);

  // ---- Recruiter cannot upload resume ----
  const { body: recForm } = buildMultipart(
    "file",
    "rec-resume.pdf",
    fakePdfContent,
    "application/pdf"
  );
  const recUploadRes = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(recruiterToken),
    body: recForm,
  });
  assert(
    "Recruiter cannot upload resume",
    recUploadRes.status === 403,
    `status=${recUploadRes.status}`
  );

  // ---- Admin cannot upload resume ----
  const { body: adminForm } = buildMultipart(
    "file",
    "admin-resume.pdf",
    fakePdfContent,
    "application/pdf"
  );
  const adminUploadRes = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(adminToken),
    body: adminForm,
  });
  assert(
    "Admin cannot upload resume",
    adminUploadRes.status === 403,
    `status=${adminUploadRes.status}`
  );

  // ---- Invalid file type rejected ----
  console.log("\n--- Validation ---");
  const { body: txtForm } = buildMultipart(
    "file",
    "notes.txt",
    Buffer.from("hello world"),
    "text/plain"
  );
  const txtRes = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(candidateToken),
    body: txtForm,
  });
  assert(
    "Invalid file type rejected",
    txtRes.status === 400,
    `status=${txtRes.status}`
  );

  // ---- No file → 400 ----
  const emptyForm = new FormData();
  const emptyRes = await fetch(`${BASE}/api/resumes/upload`, {
    method: "POST",
    headers: authHeader(candidateToken),
    body: emptyForm,
  });
  assert(
    "No file uploaded → 400",
    emptyRes.status === 400,
    `status=${emptyRes.status}`
  );

  // ============================================================
  // List Resumes
  // ============================================================
  console.log("\n--- List My Resumes ---");

  const { status: listStatus, body: listBody } = await api("/api/resumes/me", {
    headers: authHeader(candidateToken),
  });
  assert("Candidate can list resumes", listStatus === 200, `status=${listStatus}`);
  const resumeList: any[] = listBody?.data ?? [];
  assert("Resume list has at least 2 items", resumeList.length >= 2, `count=${resumeList.length}`);
  // Newest first
  if (resumeList.length >= 2) {
    const d0 = new Date(resumeList[0].createdAt).getTime();
    const d1 = new Date(resumeList[1].createdAt).getTime();
    assert("Resumes sorted newest first", d0 >= d1);
  }

  // ---- Recruiter cannot list candidate resumes ----
  const { status: recListStatus } = await api("/api/resumes/me", {
    headers: authHeader(recruiterToken),
  });
  assert("Recruiter cannot list resumes", recListStatus === 403, `status=${recListStatus}`);

  // ---- Admin cannot list candidate resumes ----
  const { status: adminListStatus } = await api("/api/resumes/me", {
    headers: authHeader(adminToken),
  });
  assert("Admin cannot list resumes", adminListStatus === 403, `status=${adminListStatus}`);

  // ============================================================
  // Unauthenticated access
  // ============================================================
  console.log("\n--- Unauthenticated access ---");
  const { status: anonProfStatus } = await api("/api/candidates/me/profile");
  assert("Anon cannot GET profile", anonProfStatus === 401, `status=${anonProfStatus}`);

  const { status: anonResStatus } = await api("/api/resumes/me");
  assert("Anon cannot list resumes", anonResStatus === 401, `status=${anonResStatus}`);

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
    console.log("\n🎉 All Phase 4 tests passed!\n");
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
