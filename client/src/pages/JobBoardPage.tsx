import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, Wifi } from "lucide-react";
import { listPublicJobs, type Job, type PaginatedResponse } from "../lib/jobs";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import styles from "./JobBoardPage.module.css";

export function JobBoardPage() {
  const [data, setData] = useState<PaginatedResponse<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [remote, setRemote] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPublicJobs({
        page,
        limit: 20,
        q: q || undefined,
        location: location || undefined,
        employmentType: employmentType || undefined,
        remote: remote === "true" ? true : remote === "false" ? false : undefined,
      });
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, q, location, employmentType, remote]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Debounced search on q/location change
  useEffect(() => {
    setPage(1);
  }, [q, location, employmentType, remote]);

  function formatSalary(job: Job) {
    if (job.salaryMin == null && job.salaryMax == null) return null;
    const fmt = (n: number) =>
      n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
    const cur = job.currency || "USD";
    if (job.salaryMin != null && job.salaryMax != null) {
      return `${cur} ${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
    }
    if (job.salaryMin != null) return `${cur} ${fmt(job.salaryMin)}+`;
    return `Up to ${cur} ${fmt(job.salaryMax!)}`;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <span className={styles.navBrand}>AI Recruit — Job Board</span>
          <div className={styles.navActions}>
            <ThemeToggle />
            <Link to="/login" className={styles.navLink}>
              Sign In
            </Link>
            <Link to="/ai-recruitment" className={styles.navLink}>
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Open Positions</h1>
          <p className={styles.subtitle}>
            Browse and search available job openings.
          </p>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Filters */}
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search jobs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <select
            className={styles.filterSelect}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
          </select>
          <select
            className={styles.filterSelect}
            value={remote}
            onChange={(e) => setRemote(e.target.value)}
          >
            <option value="">Remote?</option>
            <option value="true">Remote only</option>
            <option value="false">On-site only</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading jobs…</div>
        ) : !data || data.items.length === 0 ? (
          <div className={styles.emptyState}>No open positions found.</div>
        ) : (
          <>
            <div className={styles.jobGrid}>
              {data.items.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className={styles.jobCard}
                >
                  <h3 className={styles.jobCardTitle}>{job.title}</h3>
                  <div className={styles.jobCardMeta}>
                    <span className={styles.metaItem}>
                      <Briefcase size={14} /> {job.employmentType}
                    </span>
                    {job.location && (
                      <span className={styles.metaItem}>
                        <MapPin size={14} /> {job.location}
                      </span>
                    )}
                    {job.remote && (
                      <span className={styles.metaItem}>
                        <Wifi size={14} /> Remote
                      </span>
                    )}
                    {job.seniority && (
                      <span className={styles.metaItem}>
                        {job.seniority}
                      </span>
                    )}
                  </div>
                  {job.skillsRequired.length > 0 && (
                    <div className={styles.jobCardSkills}>
                      {job.skillsRequired.slice(0, 6).map((s) => (
                        <span key={s} className={styles.skillTag}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {formatSalary(job) && (
                    <div className={styles.salaryInfo}>{formatSalary(job)}</div>
                  )}
                </Link>
              ))}
            </div>

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
          </>
        )}
      </main>
    </div>
  );
}
