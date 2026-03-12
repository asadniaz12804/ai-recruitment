import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Wifi, Clock, CheckCircle } from "lucide-react";
import { getJob, type Job } from "../lib/jobs";
import { applyToJob } from "../lib/applications";
import styles from "./JobDetailPage.module.css";

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply state
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || applying || !resumeFile) return;
    setApplying(true);
    setApplyError(null);
    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      if (phone) formData.append("phone", phone);
      if (linkedin) formData.append("linkedin", linkedin);
      if (portfolio) formData.append("portfolio", portfolio);
      formData.append("file", resumeFile);

      await applyToJob(id, formData);
      setApplied(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApplyError(err.message);
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
    <div className={styles.container}>
        <Link to="/jobs" className={styles.backLink}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.skeleton} style={{ height: 32, width: '60%' }} />
            <div className={styles.skeleton} style={{ height: 16, width: '40%' }} />
            <div className={styles.skeleton} style={{ height: 200 }} />
          </div>
        )}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {job && (
          <div className={styles.layout}>
            <div className={styles.mainCol}>
              <h1 className={styles.jobTitle}>{job.title}</h1>

              <div className={styles.metaRow}>
                <span className={styles.metaChip}>
                  <Briefcase size={14} /> {job.employmentType}
                </span>
                {job.location && (
                  <span className={styles.metaChip}>
                    <MapPin size={14} /> {job.location}
                  </span>
                )}
                {job.remote && (
                  <span className={`${styles.metaChip} ${styles.remoteChip}`}>
                    <Wifi size={14} /> Remote
                  </span>
                )}
                {job.seniority && (
                  <span className={styles.metaChip}>
                    <Clock size={14} /> {job.seniority}
                  </span>
                )}
                <span className={statusClass(job.status)}>{job.status}</span>
              </div>

              {formatSalary(job) && (
                <div className={styles.salaryBadge}>{formatSalary(job)}</div>
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
                      <span key={s} className={styles.skillTag}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className={styles.sidebar}>
              <div className={styles.applyCard}>
                <h3 className={styles.applyCardTitle}>Apply to this position</h3>

                {applied && (
                  <div className={styles.appliedState}>
                    <CheckCircle size={18} />
                    <span>Application Submitted Successfully</span>
                  </div>
                )}

                {!applied && job.status === "open" && (
                  <form onSubmit={handleApply} className={styles.applyForm}>
                    <div className={styles.formGroup}>
                      <label>First Name *</label>
                      <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name *</label>
                      <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email *</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>LinkedIn Profile URL</label>
                      <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Portfolio / GitHub URL</label>
                      <input type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Resume (PDF/DOCX) *</label>
                      <input 
                        type="file" 
                        required 
                        accept=".pdf,.doc,.docx" 
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)} 
                      />
                    </div>
                    <button
                      className={styles.applyBtn}
                      type="submit"
                      disabled={applying || !resumeFile}
                    >
                      {applying ? "Applying…" : "Submit Application"}
                    </button>
                    {applyError && <p className={styles.applyError}>{applyError}</p>}
                  </form>
                )}

                {!applied && job.status !== "open" && (
                  <p className={styles.applyNote}>This job is not currently accepting applications.</p>
                )}
              </div>
            </aside>
          </div>
        )}
    </div>
  );
}
