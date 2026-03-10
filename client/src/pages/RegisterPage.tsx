import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../lib/auth";
import { ApiError } from "../lib/api";
import styles from "./AuthPage.module.css";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(email, password, name || undefined, role);
      navigate(getHomePath(user), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Get started with AI Recruit</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Role picker */}
          <div className={styles.rolePicker}>
            <button
              type="button"
              className={`${styles.roleOption} ${role === "candidate" ? styles.roleActive : ""}`}
              onClick={() => setRole("candidate")}
            >
              <span className={styles.roleIcon}>👤</span>
              <span className={styles.roleLabel}>Candidate</span>
              <span className={styles.roleDesc}>Find &amp; apply for jobs</span>
            </button>
            <button
              type="button"
              className={`${styles.roleOption} ${role === "recruiter" ? styles.roleActive : ""}`}
              onClick={() => setRole("recruiter")}
            >
              <span className={styles.roleIcon}>🏢</span>
              <span className={styles.roleLabel}>Recruiter</span>
              <span className={styles.roleDesc}>Post jobs &amp; hire talent</span>
            </button>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="name">Name (optional)</label>
            <input
              className={styles.input}
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              className={styles.input}
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              className={styles.input}
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <button className={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <div className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
