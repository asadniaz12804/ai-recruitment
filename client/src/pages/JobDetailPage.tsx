import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Wifi, Clock } from "lucide-react";
import { getJob, type Job } from "../lib/jobs";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import styles from "./JobDetailPage.module.css";

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <button className={styles.applyBtn} disabled>
                Apply Now
              </button>
              <p className={styles.applyNote}>
                Applications will be available in a future update (Phase 5).
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
