import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listMyApplications,
  type CandidateApplication,
  type PaginatedApplications,
} from "../lib/applications";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import styles from "./MyApplicationsPage.module.css";

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

export function MyApplicationsPage() {
  const [data, setData] = useState<PaginatedApplications<CandidateApplication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    listMyApplications({ page, limit: 20 })
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load applications")
      )
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/jobs" className={styles.navBrand}>
            AI Recruit
          </Link>
          <div className={styles.navActions}>
            <Link to="/candidate/profile" className={styles.navLink}>Profile</Link>
            <Link to="/jobs" className={styles.navLink}>Job Board</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>My Applications</h1>

        {loading && <div className={styles.loading}>Loading…</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {data && data.items.length === 0 && (
          <div className={styles.emptyState}>
            <p>You haven't applied to any jobs yet.</p>
            <p>
              <Link to="/jobs">Browse open positions</Link>
            </p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className={styles.appList}>
              {data.items.map((app) => (
                <div key={app.id} className={styles.appCard}>
                  <div className={styles.appInfo}>
                    <div className={styles.appJobTitle}>
                      {app.job ? (
                        <Link to={`/jobs/${app.job.id}`}>{app.job.title}</Link>
                      ) : (
                        "Job unavailable"
                      )}
                    </div>
                    <div className={styles.appMeta}>
                      {app.job?.companyName && <span>{app.job.companyName}</span>}
                      {app.job?.location && <span>• {app.job.location}</span>}
                      {app.job?.employmentType && <span>• {app.job.employmentType}</span>}
                    </div>
                    <div className={styles.appDate}>
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={stageBadgeClass(app.stage)}>{app.stage}</span>
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
