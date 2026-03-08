import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Wifi, Clock, CheckCircle } from "lucide-react";
import { getJob, type Job } from "../lib/jobs";
import { listMyResumes, type ResumeRecord } from "../lib/candidate";
import { applyToJob } from "../lib/applications";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import styles from "./JobDetailPage.module.css";

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply state
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getJob(id)
      .then(setJob)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Job not found");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch candidate resumes when logged in as candidate
  useEffect(() => {
    if (user?.role === "candidate") {
      listMyResumes()
        .then((r) => {
          setResumes(r);
          if (r.length > 0) setSelectedResumeId(r[0].id);
        })
        .catch(() => {});
    }
  }, [user]);

  async function handleApply() {
    if (!id || applying) return;
    setApplying(true);
    setApplyError(null);
    try {
      await applyToJob(id, selectedResumeId ? { resumeId: selectedResumeId } : undefined);
      setApplied(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Check for already-applied (409)
        if ((err as { status?: number }).status === 409) {
          setApplied(true);
        } else {
          setApplyError(err.message);
        }
      } else {
        setApplyError("Failed to apply");
      }
    } finally {
      setApplying(false);
    }
  }

  function formatSalary(j: Job) {
    if (j.salaryMin == null && j.salaryMax == null) return null;
    const fmt = (n: number) => n.toLocaleString();
    const cur = j.currency || "USD";
    if (j.salaryMin != null && j.salaryMax != null) {
      return `${cur} ${fmt(j.salaryMin)} – ${fmt(j.salaryMax)}`;
    }
    if (j.salaryMin != null) return `${cur} ${fmt(j.salaryMin)}+`;
    return `Up to ${cur} ${fmt(j.salaryMax!)}`;
  }

  function statusClass(s: string) {
    if (s === "open") return `${styles.statusBadge} ${styles.statusOpen}`;
    if (s === "draft") return `${styles.statusBadge} ${styles.statusDraft}`;
    return `${styles.statusBadge} ${styles.statusClosed}`;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/jobs" className={styles.navBrand}>
            AI Recruit — Job Board
          </Link>
          <div className={styles.navActions}>
            <ThemeToggle />
            <Link to="/login" className={styles.navLink}>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Link to="/jobs" className={styles.backLink}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>

        {loading && <div className={styles.loading}>Loading…</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {job && (
          <>
            <h1 className={styles.jobTitle}>{job.title}</h1>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Briefcase size={15} /> {job.employmentType}
              </span>
              {job.location && (
                <span className={styles.metaItem}>
                  <MapPin size={15} /> {job.location}
                </span>
              )}
              {job.remote && (
                <span className={styles.metaItem}>
                  <Wifi size={15} /> Remote
                </span>
              )}
              {job.seniority && (
                <span className={styles.metaItem}>
                  <Clock size={15} /> {job.seniority}
                </span>
              )}
              <span className={statusClass(job.status)}>{job.status}</span>
            </div>

            {formatSalary(job) && (
              <div className={styles.salaryBlock}>
                <div className={styles.salaryLabel}>Salary Range</div>
                <div className={styles.salaryValue}>{formatSalary(job)}</div>
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <div className={styles.description}>{job.description}</div>
            </div>

            {job.skillsRequired.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Required Skills</h2>
                <div className={styles.skillList}>
                  {job.skillsRequired.map((s) => (
                    <span key={s} className={styles.skillTag}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.applySection}>
              {!user && (
                <>
                  <Link to="/login" className={styles.applyBtn} style={{ textDecoration: "none", display: "inline-block", textAlign: "center", opacity: 1, cursor: "pointer" }}>
                    Sign In to Apply
                  </Link>
                  <p className={styles.applyNote}>
                    You must be logged in as a candidate to apply.
                  </p>
                </>
              )}
              {user && user.role !== "candidate" && (
                <p className={styles.applyNote}>
                  Only candidates can apply to jobs.
                </p>
              )}
              {user && user.role === "candidate" && applied && (
                <div className={styles.appliedState}>
                  <CheckCircle size={20} />
                  <span>You have applied to this job</span>
                </div>
              )}
              {user && user.role === "candidate" && !applied && job.status === "open" && (
                <>
                  {resumes.length > 0 && (
                    <div className={styles.resumeSelect}>
                      <label htmlFor="resume-select">Attach resume (optional):</label>
                      <select
                        id="resume-select"
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className={styles.resumeDropdown}
                      >
                        <option value="">No resume</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.originalFileName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    className={styles.applyBtn}
                    onClick={handleApply}
                    disabled={applying}
                    style={{ opacity: 1, cursor: applying ? "wait" : "pointer" }}
                  >
                    {applying ? "Applying…" : "Apply Now"}
                  </button>
                  {applyError && (
                    <p className={styles.applyError}>{applyError}</p>
                  )}
                </>
              )}
              {user && user.role === "candidate" && !applied && job.status !== "open" && (
                <p className={styles.applyNote}>
                  This job is not currently accepting applications.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
