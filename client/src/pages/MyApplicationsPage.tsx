import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Calendar, Video, MapPin, DollarSign, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
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
      <button className={styles.appCardHeader} onClick={handleToggle} type="button">
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
            {app.job?.location && <span className={styles.metaDot}>·</span>}
            {app.job?.location && <span>{app.job.location}</span>}
            {app.job?.employmentType && <span className={styles.metaDot}>·</span>}
            {app.job?.employmentType && <span>{app.job.employmentType}</span>}
          </div>
          <div className={styles.appDate}>
            <Calendar size={12} /> Applied {new Date(app.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className={styles.appRight}>
          <span className={stageBadgeClass(app.stage)}>{app.stage}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className={styles.appDetails}>
          {/* Interviews */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>
              <Video size={14} /> Interviews ({interviews.length})
            </div>
            {interviews.length === 0 && (
              <div className={styles.emptyDetail}>No interviews scheduled yet.</div>
            )}
            {interviews.map((iv) => (
              <div key={iv.id} className={styles.detailItem}>
                <strong>{iv.mode}</strong> — {new Date(iv.scheduledAt).toLocaleString()}
                {iv.locationOrLink && (
                  <span className={styles.detailMeta}>
                    <MapPin size={12} /> {iv.locationOrLink}
                  </span>
                )}
                {iv.notes && <div className={styles.detailMeta}>{iv.notes}</div>}
              </div>
            ))}
          </div>

          {/* Offers */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>
              <DollarSign size={14} /> Offers ({offers.length})
            </div>
            {offers.length === 0 && (
              <div className={styles.emptyDetail}>No offers yet.</div>
            )}
            {offers.map((o) => (
              <div key={o.id} className={styles.detailItem}>
                <div className={styles.offerHeader}>
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
                    <span className={styles.offerSalary}>
                      {o.salaryMin != null && `${o.currency} ${o.salaryMin.toLocaleString()}`}
                      {o.salaryMin != null && o.salaryMax != null && " – "}
                      {o.salaryMax != null &&
                        `${o.salaryMin == null ? `${o.currency} ` : ""}${o.salaryMax.toLocaleString()}`}
                    </span>
                  )}
                </div>
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
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button
                      className={styles.btnDecline}
                      disabled={responding}
                      onClick={() => handleOfferRespond(o.id, "declined")}
                    >
                      <XCircle size={14} /> Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>My Applications</h1>
        <p className={styles.subtitle}>Track your job applications and interview progress.</p>
      </header>

      {loading && (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} style={{ height: 80 }} />
          ))}
        </div>
      )}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {data && data.items.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No applications yet</p>
          <p className={styles.emptyText}>
            Start browsing open positions and apply to get started.
          </p>
          <Link to="/jobs" className={styles.emptyLink}>
            Browse Jobs
          </Link>
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
                <ChevronLeft size={16} /> Previous
              </button>
              <span className={styles.pageInfo}>
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
