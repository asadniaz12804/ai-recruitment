import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, Wifi, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { listPublicJobs, type Job, type PaginatedResponse } from "../lib/jobs";
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
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Open Positions</h1>
        <p className={styles.subtitle}>
          Find your next opportunity. {data && `${data.pagination.total} jobs available.`}
        </p>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by title, skill, or keyword…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className={styles.filterRow}>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
            <option value="">All Locations</option>
            <option value="true">Remote</option>
            <option value="false">On-site</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No positions found</p>
          <p className={styles.emptySubtitle}>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className={styles.jobList}>
            {data.items.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className={styles.jobCard}
              >
                <div className={styles.jobCardMain}>
                  <h3 className={styles.jobCardTitle}>{job.title}</h3>
                  <div className={styles.jobCardMeta}>
                    <span className={styles.metaChip}>
                      <Briefcase size={13} /> {job.employmentType}
                    </span>
                    {job.location && (
                      <span className={styles.metaChip}>
                        <MapPin size={13} /> {job.location}
                      </span>
                    )}
                    {job.remote && (
                      <span className={`${styles.metaChip} ${styles.remoteChip}`}>
                        <Wifi size={13} /> Remote
                      </span>
                    )}
                    {job.seniority && (
                      <span className={styles.metaChip}>{job.seniority}</span>
                    )}
                  </div>
                  {job.skillsRequired.length > 0 && (
                    <div className={styles.skillRow}>
                      {job.skillsRequired.slice(0, 5).map((s) => (
                        <span key={s} className={styles.skillTag}>{s}</span>
                      ))}
                      {job.skillsRequired.length > 5 && (
                        <span className={styles.skillMore}>+{job.skillsRequired.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
                {formatSalary(job) && (
                  <div className={styles.salaryBadge}>{formatSalary(job)}</div>
                )}
              </Link>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className={styles.pageInfo}>
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
