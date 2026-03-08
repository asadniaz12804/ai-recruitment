import { useEffect, useState, useCallback } from "react";
import {
  adminListUsers,
  adminUpdateUser,
  listCompanies,
  type AdminUser,
  type Company,
  type PaginatedResponse,
} from "../lib/admin";
import styles from "./AdminUsersPage.module.css";

export function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  // Inline edit state: userId -> pending changes
  const [edits, setEdits] = useState<
    Record<string, { role?: string; companyId?: string | null }>
  >({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminListUsers({
        page,
        limit: 20,
        role: roleFilter || undefined,
        email: emailFilter || undefined,
      });
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, emailFilter]);

  const fetchCompanies = useCallback(async () => {
    try {
      const result = await listCompanies();
      setCompanies(result.items);
    } catch {
      // non-critical — admin can still type companyId manually
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function handleEdit(userId: string, field: string, value: string) {
    setEdits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value === "" ? null : value,
      },
    }));
  }

  async function handleSave(userId: string) {
    const pending = edits[userId];
    if (!pending) return;

    setSaving((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {};
      if (pending.role !== undefined) payload.role = pending.role;
      if (pending.companyId !== undefined) payload.companyId = pending.companyId;

      const result = await adminUpdateUser(userId, payload as Parameters<typeof adminUpdateUser>[1]);
      setSuccess(
        `Updated ${result.user.email}` +
          (result.warnings.length > 0
            ? ` — ⚠ ${result.warnings.join("; ")}`
            : "")
      );

      // Clear edit state for this user
      setEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });

      // Refresh list
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case "admin":
        return `${styles.roleBadge} ${styles.roleAdmin}`;
      case "recruiter":
        return `${styles.roleBadge} ${styles.roleRecruiter}`;
      default:
        return `${styles.roleBadge} ${styles.roleCandidate}`;
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>
          View and manage user accounts, roles, and company assignments.
        </p>
      </header>

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Filters */}
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
          <option value="candidate">Candidate</option>
        </select>

        <input
          className={styles.filterInput}
          type="text"
          placeholder="Filter by email…"
          value={emailFilter}
          onChange={(e) => {
            setEmailFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading users…</div>
      ) : !data || data.items.length === 0 ? (
        <div className={styles.emptyState}>No users found.</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => {
                  const pending = edits[user.id];
                  const currentRole = pending?.role ?? user.role;
                  const currentCompanyId =
                    pending?.companyId !== undefined
                      ? pending.companyId
                      : user.companyId;

                  return (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.name ?? "—"}</td>
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.companyId
                          ? companies.find((c) => c.id === user.companyId)
                              ?.name ?? user.companyId
                          : "—"}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <select
                            className={styles.actionSelect}
                            value={currentRole}
                            onChange={(e) =>
                              handleEdit(user.id, "role", e.target.value)
                            }
                          >
                            <option value="candidate">candidate</option>
                            <option value="recruiter">recruiter</option>
                            <option value="admin">admin</option>
                          </select>

                          <select
                            className={styles.actionSelect}
                            value={currentCompanyId ?? ""}
                            onChange={(e) =>
                              handleEdit(user.id, "companyId", e.target.value)
                            }
                          >
                            <option value="">No company</option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <button
                            className={styles.saveBtn}
                            disabled={!pending || saving[user.id]}
                            onClick={() => handleSave(user.id)}
                          >
                            {saving[user.id] ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
        </>
      )}
    </div>
  );
}
