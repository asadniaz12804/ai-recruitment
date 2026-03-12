import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createCompany } from "../lib/admin";
import { useAuth } from "../context/AuthContext";
import styles from "./CompanyCreatePage.module.css";

export function CompanyCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const company = await createCompany({
        name: name.trim(),
        website: website.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
      });
      // Navigate to the new company's dashboard using the slug
      navigate(`/ai-recruitment/${company.slug}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Create Company</h1>
        <p className={styles.subtitle}>
          {user?.role === "recruiter" && !user.companyId
            ? "You need to create or join a company before you can start recruiting."
            : "Register a new company on the platform."}
        </p>
      </header>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="company-name">
            Company Name *
          </label>
          <input
            id="company-name"
            className={styles.input}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="company-website">
            Website
          </label>
          <input
            id="company-website"
            className={styles.input}
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="company-logo">
            Logo URL
          </label>
          <input
            id="company-logo"
            className={styles.input}
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <button
          className={styles.submitBtn}
          type="submit"
          disabled={submitting || !name.trim()}
        >
          {submitting ? "Creating…" : "Create Company"}
        </button>
      </form>
    </div>
  );
}
