import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listMyApplications,
  candidateListInterviews,
  candidateListOffers,
  candidateRespondToOffer,
  type CandidateApplication,
  type PaginatedApplications,
  type InterviewRecord,
  type OfferRecord,
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

// --------------- Expandable app card ---------------
function AppCard({ app }: { app: CandidateApplication }) {
  const [expanded, setExpanded] = useState(false);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [responding, setResponding] = useState(false);

  function loadDetails() {
    if (detailLoaded) return;
    Promise.all([
      candidateListInterviews(app.id, { limit: 50 }),
      candidateListOffers(app.id, { limit: 50 }),
    ])
      .then(([ivRes, ofRes]) => {
        setInterviews(ivRes.items);
        setOffers(ofRes.items);
        setDetailLoaded(true);
      })
      .catch(() => {});
  }

  function handleToggle() {
    if (!expanded) loadDetails();
    setExpanded((v) => !v);
  }

  async function handleOfferRespond(offerId: string, decision: "accepted" | "declined") {
    if (responding) return;
    setResponding(true);
    try {
      await candidateRespondToOffer(offerId, decision);
      // reload offers
      const ofRes = await candidateListOffers(app.id, { limit: 50 });
      setOffers(ofRes.items);
    } catch {
      // silent
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className={`${styles.appCard} ${expanded ? styles.appCardExpanded : ""}`}>
      <div className={styles.appCardTopRow} onClick={handleToggle}>
        <div className={styles.appInfo}>
          <div className={styles.appJobTitle}>
            {app.job ? (
              <Link to={`/jobs/${app.job.id}`} onClick={(e) => e.stopPropagation()}>
                {app.job.title}
              </Link>
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
          <div className={styles.expandHint}>
            {expanded ? "▲ Collapse" : "▼ View details"}
          </div>
        </div>
        <span className={stageBadgeClass(app.stage)}>{app.stage}</span>
      </div>

      {expanded && (
        <>
          {/* Interviews read-only */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>
              Interviews ({interviews.length})
            </div>
            {interviews.length === 0 && (
              <div className={styles.emptyDetail}>No interviews scheduled yet.</div>
            )}
            {interviews.map((iv) => (
              <div key={iv.id} className={styles.detailItem}>
                <strong>{iv.mode}</strong> — {new Date(iv.scheduledAt).toLocaleString()}
                {iv.locationOrLink && <span> · {iv.locationOrLink}</span>}
                {iv.notes && <div className={styles.detailMeta}>{iv.notes}</div>}
              </div>
            ))}
          </div>

          {/* Offers with accept / decline */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>
              Offers ({offers.length})
            </div>
            {offers.length === 0 && (
              <div className={styles.emptyDetail}>No offers yet.</div>
            )}
            {offers.map((o) => (
              <div key={o.id} className={styles.detailItem}>
                <span
                  className={`${styles.statusBadge} ${
                    o.status === "draft"
                      ? styles.statusDraft
                      : o.status === "sent"
                      ? styles.statusSent
                      : o.status === "accepted"
                      ? styles.statusAccepted
                      : styles.statusDeclined
                  }`}
                >
                  {o.status}
                </span>
                {(o.salaryMin != null || o.salaryMax != null) && (
                  <span>
                    {" — "}
                    {o.salaryMin != null && `${o.currency} ${o.salaryMin.toLocaleString()}`}
                    {o.salaryMin != null && o.salaryMax != null && " – "}
                    {o.salaryMax != null &&
                      `${o.salaryMin == null ? `${o.currency} ` : ""}${o.salaryMax.toLocaleString()}`}
                  </span>
                )}
                {o.message && <div className={styles.detailMeta}>{o.message}</div>}
                <div className={styles.detailMeta}>
                  {new Date(o.createdAt).toLocaleString()}
                </div>
                {o.status === "sent" && (
                  <div className={styles.offerActions}>
                    <button
                      className={styles.btnAccept}
                      disabled={responding}
                      onClick={() => handleOfferRespond(o.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className={styles.btnDecline}
                      disabled={responding}
                      onClick={() => handleOfferRespond(o.id, "declined")}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
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
                <AppCard key={app.id} app={app} />
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
