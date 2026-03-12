import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  ExternalLink,
  Download,
  Loader2,
  Linkedin,
  Github,
  Globe,
  Star,
  MessageSquare,
} from "lucide-react";
import {
  recruiterGetCandidate,
  updateApplicationStage,
  addApplicationNote,
  APPLICATION_STAGES,
  type ApplicationStage,
  type RecruiterCandidateDetail,
} from "../lib/applications";
import styles from "./RecruiterCandidateDetailPage.module.css";

const STAGE_LABELS: Record<ApplicationStage, string> = {
  applied: "Applied",
  screening: "AI Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecruiterCandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recruiterCandidateDetail", candidateId],
    queryFn: () => recruiterGetCandidate(candidateId!),
    enabled: !!candidateId,
  });

  // Stage mutation
  const stageMutation = useMutation({
    mutationFn: ({ appId, stage }: { appId: string; stage: ApplicationStage }) =>
      updateApplicationStage(appId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recruiterCandidateDetail", candidateId],
      });
    },
  });

  // Note mutation
  const noteMutation = useMutation({
    mutationFn: ({ appId, text }: { appId: string; text: string }) =>
      addApplicationNote(appId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recruiterCandidateDetail", candidateId],
      });
    },
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2 size={20} className={styles.spinner} />
          Loading candidate profile…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <button className={styles.backLink} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className={styles.errorMsg}>
          {error instanceof Error ? error.message : "Candidate not found"}
        </div>
      </div>
    );
  }

  const { candidate, profile, resumes, applications } = data;
  const initial = (candidate.name ?? candidate.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className={styles.container}>
      {/* Back */}
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back to candidates
      </button>

      {/* ====== Profile Header ====== */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarLarge}>{initial}</div>
        <div className={styles.headerInfo}>
          <h1 className={styles.candidateName}>
            {candidate.name ?? "Unnamed Candidate"}
          </h1>
          {profile?.headline && (
            <p className={styles.headline}>{profile.headline}</p>
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Mail size={13} /> {candidate.email}
            </span>
            {profile?.location && (
              <span className={styles.metaItem}>
                <MapPin size={13} /> {profile.location}
              </span>
            )}
            {profile?.yearsExperience != null && (
              <span className={styles.metaItem}>
                <Briefcase size={13} /> {profile.yearsExperience} yrs experience
              </span>
            )}
            {profile?.links?.linkedin && (
              <span className={styles.metaItem}>
                <Linkedin size={13} />
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </span>
            )}
            {profile?.links?.github && (
              <span className={styles.metaItem}>
                <Github size={13} />
                <a href={profile.links.github} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </span>
            )}
            {profile?.links?.portfolio && (
              <span className={styles.metaItem}>
                <Globe size={13} />
                <a href={profile.links.portfolio} target="_blank" rel="noreferrer">
                  Portfolio
                </a>
              </span>
            )}
          </div>

          {profile?.skills && profile.skills.length > 0 && (
            <div className={styles.skillsRow}>
              {profile.skills.map((s) => (
                <span key={s} className={styles.skillTag}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ====== Summary ====== */}
      {profile?.summary && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <div className={styles.summaryCard}>
            <p className={styles.summaryText}>{profile.summary}</p>
          </div>
        </div>
      )}

      {/* ====== Resumes / CV ====== */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Resumes / CV
        </h2>
        {resumes.length === 0 ? (
          <div className={styles.noResumes}>
            No resumes uploaded by this candidate.
          </div>
        ) : (
          <div className={styles.resumeList}>
            {resumes.map((r) => (
              <div key={r.id} className={styles.resumeCard}>
                <div className={styles.resumeIconBox}>
                  <FileText size={20} />
                </div>
                <div className={styles.resumeInfo}>
                  <p className={styles.resumeName}>{r.originalFileName}</p>
                  <p className={styles.resumeMeta}>
                    {formatBytes(r.sizeBytes)} · Uploaded {formatDate(r.uploadedAt)}
                  </p>
                </div>
                <div className={styles.resumeActions}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.viewBtn}
                  >
                    <ExternalLink size={12} /> View
                  </a>
                  <a
                    href={r.url}
                    download={r.originalFileName}
                    className={styles.downloadBtn}
                  >
                    <Download size={12} /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== Applications ====== */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Applications at Your Company</h2>
        <p className={styles.sectionSubtitle}>
          {applications.length} application{applications.length !== 1 ? "s" : ""}
        </p>
        <div className={styles.appList}>
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onStageChange={(stage) =>
                stageMutation.mutate({ appId: app.id, stage })
              }
              onAddNote={(text) =>
                noteMutation.mutate({ appId: app.id, text })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== Application Card sub-component ==========

function ApplicationCard({
  app,
  onStageChange,
  onAddNote,
}: {
  app: RecruiterCandidateDetail["applications"][number];
  onStageChange: (stage: ApplicationStage) => void;
  onAddNote: (text: string) => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleNoteSubmit = useCallback(() => {
    const text = noteText.trim();
    if (!text) return;
    onAddNote(text);
    setNoteText("");
  }, [noteText, onAddNote]);

  return (
    <div className={styles.appCard}>
      <div className={styles.appCardTop}>
        <h3 className={styles.appJobTitle}>
          {app.job?.title ?? "Unknown Job"}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span className={stageBadgeClass(app.stage)}>
            {STAGE_LABELS[app.stage] ?? app.stage}
          </span>
          <select
            className={styles.stageSelect}
            value={app.stage}
            onChange={(e) => onStageChange(e.target.value as ApplicationStage)}
          >
            {APPLICATION_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meta */}
      <div className={styles.appMetaRow}>
        <span className={styles.appMetaItem}>
          <strong>Applied:</strong> {formatDate(app.createdAt)}
        </span>
        {app.job?.employmentType && (
          <span className={styles.appMetaItem}>
            <strong>Type:</strong> {app.job.employmentType}
          </span>
        )}
        {app.job?.location && (
          <span className={styles.appMetaItem}>
            <strong>Location:</strong> {app.job.location}
          </span>
        )}
        {app.matchScore != null && (
          <span className={styles.appMetaItem}>
            <Star size={11} style={{ verticalAlign: "middle" }} />{" "}
            <strong>Match:</strong> {app.matchScore}%
          </span>
        )}
      </div>

      {/* AI Summary */}
      {app.aiSummary && (
        <p className={styles.aiSummary}>
          <span className={styles.aiLabel}>AI Summary: </span>
          {app.aiSummary}
        </p>
      )}

      {/* Notes */}
      {app.recruiterNotes.length > 0 && (
        <div className={styles.notesList}>
          <p className={styles.notesLabel}>
            <MessageSquare size={11} style={{ verticalAlign: "middle" }} /> Notes
          </p>
          {app.recruiterNotes.map((n) => (
            <div key={n.id} className={styles.noteItem}>
              {n.text}
              <span className={styles.noteDate}>{formatDateTime(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add note */}
      <div className={styles.noteForm}>
        <input
          className={styles.noteInput}
          type="text"
          placeholder="Add a note…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNoteSubmit();
          }}
        />
        <button
          className={styles.noteSubmitBtn}
          disabled={!noteText.trim()}
          onClick={handleNoteSubmit}
        >
          Add
        </button>
      </div>

      {/* Stage History toggle */}
      {app.stageHistory.length > 0 && (
        <div className={styles.historyList}>
          <button
            className={styles.backLink}
            onClick={() => setShowHistory((v) => !v)}
            style={{ fontSize: "var(--text-xs)" }}
          >
            {showHistory ? "Hide" : "Show"} stage history ({app.stageHistory.length})
          </button>
          {showHistory &&
            app.stageHistory.map((h, i) => (
              <div key={i} className={styles.historyItem}>
                <strong>{h.from}</strong> → <strong>{h.to}</strong>{" "}
                · {formatDateTime(h.changedAt)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
