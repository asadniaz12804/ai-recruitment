import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  recruiterListApplications,
  updateApplicationStage,
  addApplicationNote,
  APPLICATION_STAGES,
  type RecruiterApplication,
  type PaginatedApplications,
  type ApplicationStage,
} from "../lib/applications";
import { getJob, type Job } from "../lib/jobs";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import styles from "./RecruiterApplicantsPage.module.css";

function stageBadgeClass(stage: string): string {
  const map: Record<string, string> = {
    applied: styles.stageApplied,
    screening: styles.stageScreening,
    interview: styles.stageInterview,
    offer: styles.stageOffer,
    hired: styles.stageHired,
    rejected: styles.stageRejected,
  };
  return `${styles.stageBadge} ${map[stage] ?? ""}`;
}

// --------------- Note input component ---------------
function NoteInput({
  appId,
  onNoteAdded,
}: {
  appId: string;
  onNoteAdded: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await addApplicationNote(appId, text.trim());
      setText("");
      onNoteAdded();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.addNoteRow}>
      <input
        className={styles.noteInput}
        placeholder="Add a note…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
      />
      <button
        className={styles.noteBtn}
        onClick={handleAdd}
        disabled={!text.trim() || saving}
      >
        {saving ? "…" : "Add"}
      </button>
    </div>
  );
}

// --------------- Main page component ---------------
export function RecruiterApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [data, setData] = useState<PaginatedApplications<RecruiterApplication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [stageFilter, setStageFilter] = useState<string>("");

  const fetchApplications = useCallback(() => {
    if (!jobId) return;
    setLoading(true);
    recruiterListApplications(jobId, {
      page,
      limit: 20,
      stage: stageFilter || undefined,
    })
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load applicants")
      )
      .finally(() => setLoading(false));
  }, [jobId, page, stageFilter]);

  useEffect(() => {
    if (jobId) {
      getJob(jobId)
        .then(setJob)
        .catch(() => {});
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleStageChange(appId: string, newStage: ApplicationStage) {
    try {
      await updateApplicationStage(appId, newStage);
      fetchApplications();
    } catch {
      // silent
    }
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/jobs" className={styles.navBrand}>
            AI Recruit — Recruiter
          </Link>
          <div className={styles.navActions}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Link to="/jobs" className={styles.backLink}>
          <ArrowLeft size={14} /> Back
        </Link>

        <h1 className={styles.title}>
          Applicants{job ? ` — ${job.title}` : ""}
        </h1>
        {job && (
          <p className={styles.subtitle}>
            {job.location ?? "Remote"} · {job.employmentType}
          </p>
        )}

        {/* Stage filter buttons */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${stageFilter === "" ? styles.filterBtnActive : ""}`}
            onClick={() => {
              setStageFilter("");
              setPage(1);
            }}
          >
            All
          </button>
          {APPLICATION_STAGES.map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${stageFilter === s ? styles.filterBtnActive : ""}`}
              onClick={() => {
                setStageFilter(s);
                setPage(1);
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && <div className={styles.loading}>Loading…</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {data && data.items.length === 0 && (
          <div className={styles.emptyState}>
            No applicants{stageFilter ? ` in "${stageFilter}" stage` : ""} yet.
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className={styles.appList}>
              {data.items.map((app) => (
                <div key={app.id} className={styles.appCard}>
                  <div className={styles.appHeader}>
                    <div className={styles.candidateInfo}>
                      <div className={styles.candidateName}>
                        {app.candidate?.name ?? app.candidate?.email ?? "Unknown"}
                      </div>
                      {app.candidate?.name && (
                        <div className={styles.candidateEmail}>
                          {app.candidate.email}
                        </div>
                      )}
                      {app.candidateProfile?.headline && (
                        <div className={styles.candidateHeadline}>
                          {app.candidateProfile.headline}
                        </div>
                      )}
                      {app.candidateProfile?.skills &&
                        app.candidateProfile.skills.length > 0 && (
                          <div className={styles.skillList}>
                            {app.candidateProfile.skills.map((s) => (
                              <span key={s} className={styles.skillTag}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      {app.resume && (
                        <a
                          href={app.resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.resumeLink}
                        >
                          📎 {app.resume.originalFileName}
                        </a>
                      )}
                      <div className={styles.appDate}>
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className={styles.stageControl}>
                      <select
                        className={styles.stageDropdown}
                        value={app.stage}
                        onChange={(e) =>
                          handleStageChange(app.id, e.target.value as ApplicationStage)
                        }
                      >
                        {APPLICATION_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className={stageBadgeClass(app.stage)}>{app.stage}</span>
                    </div>
                  </div>

                  {/* Notes section */}
                  <div className={styles.notesSection}>
                    <div className={styles.notesTitle}>Recruiter Notes</div>
                    {app.recruiterNotes.length > 0 && (
                      <div className={styles.notesList}>
                        {app.recruiterNotes.map((note) => (
                          <div key={note.id} className={styles.noteItem}>
                            {note.text}
                            <div className={styles.noteDate}>
                              {new Date(note.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <NoteInput appId={app.id} onNoteAdded={fetchApplications} />
                  </div>
                </div>
              ))}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
