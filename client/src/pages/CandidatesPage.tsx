import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Search, Filter, Star, ExternalLink, ChevronRight, Loader2, Inbox, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { recruiterListJobs, type Job } from '../lib/jobs';
import {
    recruiterListApplications,
    updateApplicationStage,
    APPLICATION_STAGES,
    type RecruiterApplication,
    type ApplicationStage,
} from '../lib/applications';
import styles from './CandidatesPage.module.css';

const STAGE_LABELS: Record<ApplicationStage, string> = {
    applied: 'Applied',
    screening: 'AI Screening',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
};

const BOARD_STAGES: ApplicationStage[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export const CandidatesPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'board' | 'list'>('board');
    const [searchQuery, setSearchQuery] = useState('');
    const [jobFilter, setJobFilter] = useState('');
    const [stageFilter, setStageFilter] = useState('');

    // 1. Fetch recruiter's jobs
    const { data: jobsData } = useQuery({
        queryKey: ['recruiterJobs'],
        queryFn: () => recruiterListJobs({ limit: 100 }),
    });

    const jobs: Job[] = jobsData?.items ?? [];

    // 2. Fetch applications for each job
    const { data: appsData, isLoading } = useQuery({
        queryKey: ['recruiterAllApps', jobs.map(j => j.id)],
        queryFn: async () => {
            if (!jobs.length) return [];
            const results = await Promise.all(
                jobs.map((job) =>
                    recruiterListApplications(job.id, { limit: 200 }).then((res) =>
                        res.items.map((app) => ({ ...app, _jobId: job.id, _jobTitle: job.title }))
                    )
                )
            );
            return results.flat();
        },
        enabled: jobs.length > 0,
    });

    type EnrichedApp = RecruiterApplication & { _jobId: string; _jobTitle: string };
    const allApps: EnrichedApp[] = (appsData as EnrichedApp[]) ?? [];

    // 3. Filter
    const filteredApps = useMemo(() => {
        let result = allApps;
        if (jobFilter) {
            result = result.filter((a) => a._jobId === jobFilter);
        }
        if (stageFilter) {
            result = result.filter((a) => a.stage === stageFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((a) => {
                const name = a.candidate?.name?.toLowerCase() ?? '';
                const email = a.candidate?.email?.toLowerCase() ?? '';
                const skills = a.candidateProfile?.skills?.join(' ').toLowerCase() ?? '';
                const jobTitle = a._jobTitle.toLowerCase();
                return name.includes(q) || email.includes(q) || skills.includes(q) || jobTitle.includes(q);
            });
        }
        return result;
    }, [allApps, jobFilter, stageFilter, searchQuery]);

    // 4. Stage mutation
    const stageMutation = useMutation({
        mutationFn: ({ appId, stage }: { appId: string; stage: ApplicationStage }) =>
            updateApplicationStage(appId, stage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruiterAllApps'] });
        },
    });

    const handleStageChange = useCallback(
        (appId: string, newStage: ApplicationStage) => {
            stageMutation.mutate({ appId, stage: newStage });
        },
        [stageMutation]
    );

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Candidates</h1>
                    <p className={styles.subtitle}>Track and manage your applicant pipeline.</p>
                </div>
                <div className={styles.actions}>
                    <div className={styles.viewToggle}>
                        <button
                            className={clsx(styles.toggleBtn, activeTab === 'board' && styles.active)}
                            onClick={() => setActiveTab('board')}
                        >
                            Board
                        </button>
                        <button
                            className={clsx(styles.toggleBtn, activeTab === 'list' && styles.active)}
                            onClick={() => setActiveTab('list')}
                        >
                            List
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search candidates by name, email, or skills..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filters}>
                    <select className={styles.select} value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
                        <option value="">All Jobs</option>
                        {jobs.map((job) => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                    <select className={styles.select} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                        <option value="">All Stages</option>
                        {BOARD_STAGES.map((s) => (
                            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Loading candidates…</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && allApps.length === 0 && (
                <Card padding="lg" className={styles.emptyState}>
                    <Inbox size={48} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>No candidates yet</h3>
                    <p className={styles.emptyText}>
                        Candidates will appear here once they apply to your posted jobs.
                    </p>
                </Card>
            )}

            {/* Kanban Board */}
            {!isLoading && allApps.length > 0 && activeTab === 'board' && (
                <div className={styles.boardScrollContainer}>
                    <div className={styles.board}>
                        {BOARD_STAGES.map((stage) => {
                            const stageCandidates = filteredApps.filter((c) => c.stage === stage);

                            return (
                                <div key={stage} className={styles.column}>
                                    <div className={styles.columnHeader}>
                                        <h3 className={styles.columnTitle}>{STAGE_LABELS[stage]}</h3>
                                        <span className={styles.columnCount}>{stageCandidates.length}</span>
                                    </div>

                                    <div className={styles.columnContent}>
                                        {stageCandidates.map((app) => (
                                            <Card
                                                key={app.id}
                                                padding="md"
                                                className={styles.candidateCard}
                                                onClick={() => {
                                                    if (app.candidate?.id && user?.companyName) {
                                                        navigate(`/ai-recruitment/${encodeURIComponent(user.companyName)}/candidates/${app.candidate.id}`);
                                                    }
                                                }}
                                                style={{ cursor: app.candidate?.id ? 'pointer' : undefined }}
                                            >
                                                <div className={styles.cardHeader}>
                                                    <h4 className={styles.candidateName}>
                                                        {app.candidate?.name ?? app.candidate?.email ?? 'Unknown'}
                                                    </h4>
                                                </div>

                                                <p className={styles.candidateRole}>{app._jobTitle}</p>

                                                {app.candidateProfile?.skills && app.candidateProfile.skills.length > 0 && (
                                                    <div className={styles.skillTags}>
                                                        {app.candidateProfile.skills.slice(0, 3).map((s) => (
                                                            <span key={s} className={styles.skillTag}>{s}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className={styles.cardMeta}>
                                                    {app.matchScore ? (
                                                        <div className={styles.scoreWrapper}>
                                                            <Star size={12} className={styles.starIcon} />
                                                            <span className={styles.scoreText}>{app.matchScore}% Match</span>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.timeText}>{formatDate(app.createdAt)}</span>
                                                    )}

                                                    <div className={styles.avatarGroup}>
                                                        <div className={styles.miniAvatar}>
                                                            {(app.candidate?.name ?? app.candidate?.email ?? '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stage actions */}
                                                <div className={styles.cardActions}>
                                                    <select
                                                        className={styles.stageSelect}
                                                        value={app.stage}
                                                        onChange={(e) => handleStageChange(app.id, e.target.value as ApplicationStage)}
                                                    >
                                                        {BOARD_STAGES.map((s) => (
                                                            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </Card>
                                        ))}

                                        {stageCandidates.length === 0 && (
                                            <div className={styles.columnEmpty}>No candidates</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* List View */}
            {!isLoading && allApps.length > 0 && activeTab === 'list' && (
                <Card padding="none" className={styles.listTable}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Candidate</th>
                                    <th className={styles.th}>Job</th>
                                    <th className={styles.th}>Stage</th>
                                    <th className={styles.th}>AI Score</th>
                                    <th className={styles.th}>Applied</th>
                                    <th className={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApps.map((app) => (
                                    <tr key={app.id} className={styles.tr}>
                                        <td className={styles.td}>
                                            <div className={styles.cellCandidate}>
                                                <div className={styles.miniAvatar}>
                                                    {(app.candidate?.name ?? app.candidate?.email ?? '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={styles.cellName}>
                                                        {app.candidate?.name ?? 'Unknown'}
                                                    </div>
                                                    <div className={styles.cellEmail}>
                                                        {app.candidate?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>{app._jobTitle}</td>
                                        <td className={styles.td}>
                                            <Badge variant={
                                                app.stage === 'hired' ? 'success'
                                                    : app.stage === 'rejected' ? 'danger'
                                                        : app.stage === 'offer' ? 'brand'
                                                            : 'default'
                                            }>
                                                {STAGE_LABELS[app.stage]}
                                            </Badge>
                                        </td>
                                        <td className={styles.td}>
                                            {app.matchScore ? (
                                                <span className={styles.scoreText}>{app.matchScore}%</span>
                                            ) : (
                                                <span className={styles.timeText}>—</span>
                                            )}
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.timeText}>{formatDate(app.createdAt)}</span>
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <select
                                                    className={styles.stageSelect}
                                                    value={app.stage}
                                                    onChange={(e) => handleStageChange(app.id, e.target.value as ApplicationStage)}
                                                >
                                                    {BOARD_STAGES.map((s) => (
                                                        <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                                                    ))}
                                                </select>
                                                {app.candidate?.id && (
                                                    <button
                                                        className={styles.viewProfileBtn}
                                                        title="View full profile"
                                                        onClick={() => {
                                                            if (user?.companyName) {
                                                                navigate(`/ai-recruitment/${encodeURIComponent(user.companyName)}/candidates/${app.candidate!.id}`);
                                                            }
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredApps.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.noResults}>
                                            No candidates match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};
