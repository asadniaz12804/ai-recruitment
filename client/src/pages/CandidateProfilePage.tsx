import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, ExternalLink } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import {
  getMyCandidateProfile,
  updateMyCandidateProfile,
  uploadResume,
  listMyResumes,
  type CandidateProfilePayload,
} from "../lib/candidate";
import styles from "./CandidateProfilePage.module.css";

export function CandidateProfilePage() {
  const queryClient = useQueryClient();

  // --- Profile ---
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ["candidateProfile"],
    queryFn: getMyCandidateProfile,
  });

  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // seed form when profile loads
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? "");
      setSummary(profile.summary ?? "");
      setSkillsRaw(profile.skills.join(", "));
      setYearsExp(
        profile.yearsExperience != null ? String(profile.yearsExperience) : ""
      );
      setLocation(profile.location ?? "");
      setLinkedin(profile.links?.linkedin ?? "");
      setGithub(profile.links?.github ?? "");
      setPortfolio(profile.links?.portfolio ?? "");
    }
  }, [profile]);

  const profileMut = useMutation({
    mutationFn: (p: CandidateProfilePayload) =>
      updateMyCandidateProfile(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidateProfile"] });
      setProfileMsg({ type: "success", text: "Profile saved!" });
      setTimeout(() => setProfileMsg(null), 3000);
    },
    onError: (err: unknown) => {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save",
      });
    },
  });

  const handleProfileSave = useCallback(() => {
    const skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: CandidateProfilePayload = {
      headline: headline.trim() || undefined,
      summary: summary.trim() || undefined,
      skills,
      yearsExperience: yearsExp ? Number(yearsExp) : null,
      location: location.trim() || undefined,
      links: {
        linkedin: linkedin.trim() || undefined,
        github: github.trim() || undefined,
        portfolio: portfolio.trim() || undefined,
      },
    };
    profileMut.mutate(payload);
  }, [
    headline,
    summary,
    skillsRaw,
    yearsExp,
    location,
    linkedin,
    github,
    portfolio,
    profileMut,
  ]);

  // --- Resumes ---
  const {
    data: resumes,
    isLoading: resumesLoading,
  } = useQuery({
    queryKey: ["myResumes"],
    queryFn: listMyResumes,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myResumes"] });
      setUploadMsg({ type: "success", text: "Resume uploaded!" });
      setTimeout(() => setUploadMsg(null), 3000);
    },
    onError: (err: unknown) => {
      setUploadMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Upload failed",
      });
    },
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadMsg(null);
        uploadMut.mutate(file);
      }
      // reset input so re-selecting same file triggers change
      e.target.value = "";
    },
    [uploadMut]
  );

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function parseStatusClass(s: string) {
    if (s === "done") return `${styles.statusBadge} ${styles.statusDone}`;
    if (s === "failed") return `${styles.statusBadge} ${styles.statusFailed}`;
    return `${styles.statusBadge} ${styles.statusPending}`;
  }

  if (profileLoading) {
    return <div className={styles.loading}>Loading profile…</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>
          Keep your profile up to date to get the best job matches.
        </p>
      </header>

      {/* Profile Form */}
      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile Information</h2>

        {profileMsg && (
          <div
            className={
              profileMsg.type === "success" ? styles.successMsg : styles.errorMsg
            }
          >
            {profileMsg.text}
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.fullSpan}>
            <Input
              label="Professional Headline"
              placeholder="e.g. Senior Frontend Engineer"
              fullWidth
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          <Input
            label="Location"
            placeholder="e.g. New York, NY"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Input
            label="Years of Experience"
            type="number"
            placeholder="5"
            fullWidth
            value={yearsExp}
            onChange={(e) => setYearsExp(e.target.value)}
          />

          <div className={styles.fullSpan}>
            <Input
              label="Skills (comma-separated)"
              placeholder="React, TypeScript, Node.js"
              fullWidth
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
            />
          </div>

          <div className={`${styles.fullSpan} ${styles.fieldGroup}`}>
            <label className={styles.label}>Summary</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Tell recruiters about yourself…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Links */}
          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/…"
            fullWidth
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
          <Input
            label="GitHub URL"
            placeholder="https://github.com/…"
            fullWidth
            value={github}
            onChange={(e) => setGithub(e.target.value)}
          />
          <div className={styles.fullSpan}>
            <Input
              label="Portfolio URL"
              placeholder="https://…"
              fullWidth
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant="primary"
            onClick={handleProfileSave}
            disabled={profileMut.isPending}
          >
            {profileMut.isPending ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </Card>

      {/* Resume Section */}
      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>My Resumes</h2>

        {uploadMsg && (
          <div
            className={
              uploadMsg.type === "success" ? styles.successMsg : styles.errorMsg
            }
          >
            {uploadMsg.text}
          </div>
        )}

        <div className={styles.resumeUploadArea}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
          <label
            className={styles.uploadLabel}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            {uploadMut.isPending ? "Uploading…" : "Upload Resume (PDF, DOC, DOCX)"}
          </label>
          {uploadMut.isPending && (
            <span className={styles.uploadingText}>Please wait…</span>
          )}
        </div>

        {resumesLoading && (
          <div className={styles.loading}>Loading resumes…</div>
        )}

        {!resumesLoading && resumes && resumes.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>No resumes uploaded yet.</p>
          </div>
        )}

        {resumes && resumes.length > 0 && (
          <div className={styles.resumeList}>
            {resumes.map((r) => (
              <div key={r.id} className={styles.resumeItem}>
                <div className={styles.resumeInfo}>
                  <span className={styles.resumeName}>
                    {r.originalFileName}
                  </span>
                  <span className={styles.resumeMeta}>
                    {formatSize(r.sizeBytes)} ·{" "}
                    {new Date(r.uploadedAt).toLocaleDateString()} ·{" "}
                    <span className={parseStatusClass(r.parseStatus)}>
                      {r.parseStatus}
                    </span>
                  </span>
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.resumeLink}
                >
                  <ExternalLink size={14} style={{ marginRight: 4 }} />
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
