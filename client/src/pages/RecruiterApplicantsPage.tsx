import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  recruiterListApplications,
  updateApplicationStage,
  addApplicationNote,
  createInterview,
  listInterviews,
  createOffer,
  listOffers,
  updateOfferStatus,
  APPLICATION_STAGES,
  type RecruiterApplication,
  type PaginatedApplications,
  type ApplicationStage,
  type InterviewRecord,
  type InterviewMode,
  type OfferRecord,
  type OfferStatus,
} from "../lib/applications";
import { getJob, type Job } from "../lib/jobs";
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

// --------------- Interview section component ---------------
function InterviewSection({
  appId,
  onUpdate,
}: {
  appId: string;
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState<InterviewMode>("video");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function loadInterviews() {
    listInterviews(appId, { limit: 50 })
      .then((res) => {
        setInterviews(res.items);
        setLoaded(true);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  async function handleCreate() {
    if (!scheduledAt || saving) return;
    setSaving(true);
    try {
      await createInterview(appId, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        mode,
        locationOrLink: locationOrLink || undefined,
        notes: notes || undefined,
      });
      setScheduledAt("");
      setLocationOrLink("");
      setNotes("");
      setShowForm(false);
      loadInterviews();
      onUpdate();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.sectionDivider}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          Interviews {loaded ? `(${interviews.length})` : ""}
        </span>
        <button
          className={styles.toggleBtn}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ Schedule"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: "0.5rem" }}>
          <div className={styles.formRow}>
            <input
              type="datetime-local"
              className={styles.inputSm}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <select
              className={styles.selectSm}
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
            >
              <option value="phone">Phone</option>
              <option value="video">Video</option>
              <option value="onsite">Onsite</option>
            </select>
            <input
              className={styles.inputSm}
              placeholder="Link / location"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
            />
          </div>
          <textarea
            className={styles.textareaSm}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className={styles.btnPrimary}
            onClick={handleCreate}
            disabled={!scheduledAt || saving}
            style={{ marginTop: "0.35rem" }}
          >
            {saving ? "Saving…" : "Schedule Interview"}
          </button>
        </div>
      )}

      {interviews.map((iv) => (
        <div key={iv.id} className={styles.listItem}>
          <strong>{iv.mode}</strong> — {new Date(iv.scheduledAt).toLocaleString()}
          {iv.locationOrLink && <span> · {iv.locationOrLink}</span>}
          {iv.notes && <div className={styles.listMeta}>{iv.notes}</div>}
        </div>
      ))}
    </div>
  );
}

// --------------- Offer section component ---------------
function offerStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: styles.statusDraft,
    sent: styles.statusSent,
    accepted: styles.statusAccepted,
    declined: styles.statusDeclined,
  };
  return `${styles.statusBadge} ${map[status] ?? ""}`;
}

function OfferSection({
  appId,
  onUpdate,
}: {
  appId: string;
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function loadOffers() {
    listOffers(appId, { limit: 50 })
      .then((res) => {
        setOffers(res.items);
        setLoaded(true);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  async function handleCreate() {
    if (saving) return;
    setSaving(true);
    try {
      await createOffer(appId, {
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        currency: currency || "USD",
        message: message || undefined,
      });
      setSalaryMin("");
      setSalaryMax("");
      setMessage("");
      setShowForm(false);
      loadOffers();
      onUpdate();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(offerId: string) {
    try {
      await updateOfferStatus(offerId, "sent" as OfferStatus);
      loadOffers();
    } catch {
      // silent
    }
  }

  return (
    <div className={styles.sectionDivider}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          Offers {loaded ? `(${offers.length})` : ""}
        </span>
        <button
          className={styles.toggleBtn}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ Create Offer"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: "0.5rem" }}>
          <div className={styles.formRow}>
            <input
              type="number"
              className={styles.inputSm}
              placeholder="Min salary"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              min={0}
            />
            <input
              type="number"
              className={styles.inputSm}
              placeholder="Max salary"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              min={0}
            />
            <input
              className={styles.inputSm}
              placeholder="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ width: "70px" }}
            />
          </div>
          <textarea
            className={styles.textareaSm}
            placeholder="Message to candidate (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className={styles.btnPrimary}
            onClick={handleCreate}
            disabled={saving}
            style={{ marginTop: "0.35rem" }}
          >
            {saving ? "Saving…" : "Create Offer"}
          </button>
        </div>
      )}

      {offers.map((o) => (
        <div key={o.id} className={styles.listItem}>
          <span className={offerStatusClass(o.status)}>{o.status}</span>
          {(o.salaryMin != null || o.salaryMax != null) && (
            <span>
              {" — "}
              {o.salaryMin != null && `${o.currency} ${o.salaryMin.toLocaleString()}`}
              {o.salaryMin != null && o.salaryMax != null && " – "}
              {o.salaryMax != null && `${o.salaryMin == null ? `${o.currency} ` : ""}${o.salaryMax.toLocaleString()}`}
            </span>
          )}
          {o.message && <div className={styles.listMeta}>{o.message}</div>}
          <div className={styles.listMeta}>
            {new Date(o.createdAt).toLocaleString()}
          </div>
          {o.status === "draft" && (
            <button
              className={styles.btnSuccess}
              onClick={() => handleSend(o.id)}
              style={{ marginTop: "0.25rem" }}
            >
              Send Offer
            </button>
          )}
        </div>
      ))}
    </div>
  );
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
    <div className={styles.container}>
      <Link to="/jobs" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Jobs
      </Link>

      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Applicants{job ? ` — ${job.title}` : ""}
        </h1>
        {job && (
          <p className={styles.subtitle}>
            {job.location ?? "Remote"} · {job.employmentType}
          </p>
        )}
      </header>

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

                  {/* AI Analysis section */}
                  {(app.matchScore != null || app.aiSummary) && (
                    <div className={styles.aiSection}>
                      <div className={styles.aiTitle}>AI Analysis</div>
                      <div className={styles.aiBody}>
                        {app.matchScore != null && (
                          <span
                            className={[
                              styles.scoreBadge,
                              app.matchScore >= 80
                                ? styles.scoreHigh
                                : app.matchScore >= 50
                                  ? styles.scoreMed
                                  : styles.scoreLow,
                            ].join(" ")}
                          >
                            Match: {app.matchScore}%
                          </span>
                        )}
                        {app.aiSummary && (
                          <p className={styles.aiSummary}>{app.aiSummary}</p>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Interview section */}
                  <InterviewSection appId={app.id} onUpdate={fetchApplications} />

                  {/* Offer section */}
                  <OfferSection appId={app.id} onUpdate={fetchApplications} />
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
    </div>
  );
}
