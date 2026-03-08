import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { JobCreateModal } from '../modules/jobs/JobCreateModal';
import { recruiterListJobs, deleteJob, type Job, type RecruiterJobParams } from '../lib/jobs';
import styles from './JobsPage.module.css';

export const JobsPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const params: RecruiterJobParams = {
        page,
        limit: 10,
        ...(search && { q: search }),
        ...(statusFilter && { status: statusFilter }),
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['recruiterJobs', params],
        queryFn: () => recruiterListJobs(params),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => deleteJob(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] }),
    });

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    }, []);

    const handleStatusFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1);
    }, []);

    const handleDelete = useCallback((job: Job) => {
        if (window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
            deleteMut.mutate(job.id);
        }
    }, [deleteMut]);

    const handleEdit = useCallback((job: Job) => {
        setEditingJob(job);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setEditingJob(null);
    }, []);

    const jobs = data?.items ?? [];
    const pagination = data?.pagination;

    function badgeVariant(s: string): 'success' | 'warning' | 'default' {
        if (s === 'open') return 'success';
        if (s === 'draft') return 'warning';
        return 'default';
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Jobs</h1>
                    <p className={styles.subtitle}>Manage your active postings and drafts.</p>
                </div>
                <Button onClick={() => { setEditingJob(null); setIsModalOpen(true); }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Create Job
                </Button>
            </header>

            <Card padding="none" className={styles.tableCard}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className={styles.searchInput}
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className={styles.filters}>
                        <select className={styles.searchInput} value={statusFilter} onChange={handleStatusFilter} style={{ paddingLeft: '12px', maxWidth: 160 }}>
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {isLoading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>}
                {error && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-600)' }}>Failed to load jobs</div>}

                {!isLoading && !error && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No jobs found. Create your first job posting.</td></tr>
                                ) : jobs.map(job => (
                                    <tr key={job.id}>
                                        <td>
                                            <div className={styles.jobInfo}>
                                                <span className={styles.jobTitle}>{job.title}</span>
                                                <span className={styles.jobMeta}>{job.employmentType}{job.seniority ? ` • ${job.seniority}` : ''}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variant={badgeVariant(job.status)}>
                                                {job.status}
                                            </Badge>
                                        </td>
                                        <td>{job.remote ? 'Remote' : 'On-site'}</td>
                                        <td>{job.location || '—'}</td>
                                        <td className={styles.actionsCell}>
                                            <button className={styles.actionBtn} aria-label="Edit job" onClick={() => handleEdit(job)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={styles.actionBtn} aria-label="Delete job" onClick={() => handleDelete(job)} style={{ color: 'var(--danger-600)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft size={14} /> Prev
                        </Button>
                        <span className={styles.pageInfo}>Page {pagination.page} of {pagination.totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                            Next <ChevronRight size={14} />
                        </Button>
                    </div>
                )}
            </Card>

            {isModalOpen && <JobCreateModal onClose={handleModalClose} editJob={editingJob} />}
        </div>
    );
};
