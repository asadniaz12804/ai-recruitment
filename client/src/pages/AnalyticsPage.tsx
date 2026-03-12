import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Loader2 } from 'lucide-react';
import { recruiterListJobs, type Job } from '../lib/jobs';
import {
    recruiterListApplications,
    type RecruiterApplication,
    type ApplicationStage,
} from '../lib/applications';
import styles from './AnalyticsPage.module.css';

interface AnalyticsData {
    totalJobs: number;
    activeJobs: number;
    totalApps: number;
    stageCounts: Record<string, number>;
    avgTimeToHireDays: number | null;
    offerAcceptRate: number | null;
    jobBreakdown: { title: string; count: number }[];
}

const FUNNEL_STAGES: { key: ApplicationStage; label: string; color: string }[] = [
    { key: 'applied', label: 'Applied', color: 'var(--primary-200)' },
    { key: 'screening', label: 'Screened', color: 'var(--primary-400)' },
    { key: 'interview', label: 'Interview', color: 'var(--primary-600)' },
    { key: 'offer', label: 'Offer', color: 'var(--primary-800)' },
    { key: 'hired', label: 'Hired', color: 'var(--success-bg)' },
    { key: 'rejected', label: 'Rejected', color: 'var(--danger-bg)' },
];

export const AnalyticsPage = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const allJobsRes = await recruiterListJobs({ limit: 100 });
                const jobs = allJobsRes.items;
                const activeJobs = jobs.filter((j) => j.status === 'open').length;

                // Fetch applications per job
                const perJob: { job: Job; apps: RecruiterApplication[] }[] = await Promise.all(
                    jobs.map(async (job) => {
                        const res = await recruiterListApplications(job.id, { limit: 500 }).catch(() => ({
                            items: [] as RecruiterApplication[],
                            pagination: { total: 0 },
                        }));
                        return { job, apps: res.items };
                    })
                );

                const allApps = perJob.flatMap((p) => p.apps);

                // Stage counts
                const stageCounts: Record<string, number> = {};
                for (const app of allApps) {
                    stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1;
                }

                // Average time-to-hire (applied → hired)
                const hiredApps = allApps.filter((a) => a.stage === 'hired');
                let avgTimeToHireDays: number | null = null;
                if (hiredApps.length > 0) {
                    const totalDays = hiredApps.reduce((sum, a) => {
                        const created = new Date(a.createdAt).getTime();
                        const updated = new Date(a.updatedAt).getTime();
                        return sum + (updated - created) / (1000 * 60 * 60 * 24);
                    }, 0);
                    avgTimeToHireDays = Math.round(totalDays / hiredApps.length);
                }

                // Offer acceptance rate
                const offerCount = (stageCounts['offer'] || 0) + (stageCounts['hired'] || 0);
                const offerAcceptRate = offerCount > 0
                    ? Math.round(((stageCounts['hired'] || 0) / offerCount) * 100)
                    : null;

                // Per-job breakdown
                const jobBreakdown = perJob
                    .map((p) => ({ title: p.job.title, count: p.apps.length }))
                    .sort((a, b) => b.count - a.count);

                setData({
                    totalJobs: jobs.length,
                    activeJobs,
                    totalApps: allApps.length,
                    stageCounts,
                    avgTimeToHireDays,
                    offerAcceptRate,
                    jobBreakdown,
                });
            } catch {
                setData({
                    totalJobs: 0,
                    activeJobs: 0,
                    totalApps: 0,
                    stageCounts: {},
                    avgTimeToHireDays: null,
                    offerAcceptRate: null,
                    jobBreakdown: [],
                });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const maxFunnel = data
        ? Math.max(1, ...FUNNEL_STAGES.map((s) => data.stageCounts[s.key] || 0))
        : 1;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analytics</h1>
                    <p className={styles.subtitle}>Measure your hiring performance and AI efficiency.</p>
                </div>
            </header>

            {loading && (
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Loading analytics…</span>
                </div>
            )}

            {!loading && data && (
                <>
                    {/* Top Level KPIs */}
                    <div className={styles.kpiGrid}>
                        <Card className={styles.kpiCard}>
                            <h3 className={styles.kpiLabel}>Active Jobs</h3>
                            <div className={styles.kpiValueGroup}>
                                <span className={styles.kpiValue}>
                                    {data.activeJobs}
                                    <span className={styles.kpiUnit}> / {data.totalJobs} total</span>
                                </span>
                            </div>
                        </Card>

                        <Card className={styles.kpiCard}>
                            <h3 className={styles.kpiLabel}>Total Applications</h3>
                            <div className={styles.kpiValueGroup}>
                                <span className={styles.kpiValue}>{data.totalApps}</span>
                            </div>
                        </Card>

                        <Card className={styles.kpiCard}>
                            <h3 className={styles.kpiLabel}>Time to Hire (Avg)</h3>
                            <div className={styles.kpiValueGroup}>
                                <span className={styles.kpiValue}>
                                    {data.avgTimeToHireDays !== null ? (
                                        <>{data.avgTimeToHireDays}<span className={styles.kpiUnit}> days</span></>
                                    ) : (
                                        <span className={styles.kpiUnit}>No hires yet</span>
                                    )}
                                </span>
                            </div>
                        </Card>

                        <Card className={styles.kpiCard}>
                            <h3 className={styles.kpiLabel}>Offer Acceptance Rate</h3>
                            <div className={styles.kpiValueGroup}>
                                <span className={styles.kpiValue}>
                                    {data.offerAcceptRate !== null ? (
                                        <>{data.offerAcceptRate}<span className={styles.kpiUnit}>%</span></>
                                    ) : (
                                        <span className={styles.kpiUnit}>No offers yet</span>
                                    )}
                                </span>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className={styles.chartsGrid}>
                        {/* Funnel Chart */}
                        <Card padding="lg" className={styles.chartWrapper}>
                            <div className={styles.chartHeader}>
                                <h3 className={styles.chartTitle}>Hiring Pipeline Conversion</h3>
                            </div>
                            <div className={styles.funnelChart}>
                                {FUNNEL_STAGES.map((stage) => {
                                    const count = data.stageCounts[stage.key] || 0;
                                    const pct = Math.max(3, (count / maxFunnel) * 100);
                                    return (
                                        <div key={stage.key} className={styles.funnelRow}>
                                            <div className={styles.funnelLabel}>{stage.label}</div>
                                            <div className={styles.funnelBarArea}>
                                                <div
                                                    className={styles.funnelBar}
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: stage.color,
                                                        color: stage.key === 'hired' || stage.key === 'rejected'
                                                            ? stage.key === 'hired' ? 'var(--success-text)' : 'var(--danger-text)'
                                                            : undefined,
                                                    }}
                                                >
                                                    {count}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Per-Job Breakdown */}
                        <Card padding="lg" className={styles.chartWrapper}>
                            <div className={styles.chartHeader}>
                                <h3 className={styles.chartTitle}>Applications by Job</h3>
                            </div>
                            <div className={styles.sourceList}>
                                {data.jobBreakdown.length === 0 && (
                                    <p className={styles.emptyText}>No jobs posted yet.</p>
                                )}
                                {data.jobBreakdown.map((item, i) => {
                                    const colors = [
                                        'var(--primary-600)',
                                        'var(--primary-400)',
                                        'var(--primary-300)',
                                        'var(--surface-active)',
                                        'var(--warning-bg)',
                                    ];
                                    return (
                                        <div key={i} className={styles.sourceItem}>
                                            <div className={styles.sourceInfo}>
                                                <div
                                                    className={styles.sourceColor}
                                                    style={{ backgroundColor: colors[i % colors.length] }}
                                                />
                                                <span className={styles.sourceName}>{item.title}</span>
                                            </div>
                                            <span className={styles.sourceMetric}>
                                                {item.count} app{item.count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};
