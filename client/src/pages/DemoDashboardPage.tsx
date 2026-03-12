// src/pages/DemoDashboardPage.tsx — Read-only demo dashboard with hardcoded data
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
    Users, Briefcase, FileCheck, TrendingUp,
    Star, LayoutDashboard, GitMerge, BarChart3,
    Settings, X, ArrowLeft
} from 'lucide-react';
import clsx from 'clsx';
import styles from './DemoDashboard.module.css';

/* ──────────────────────────────────────────
   HARDCODED DEMO DATA
   ────────────────────────────────────────── */
const DEMO_COMPANY = 'Acme Corp';

const DEMO_STATS = {
    activeJobs: 8,
    totalApplications: 247,
    interviewStage: 34,
    offerStage: 12,
};

const DEMO_STAGE_COUNTS: Record<string, number> = {
    applied: 98,
    screening: 67,
    interview: 34,
    offer: 12,
    hired: 36,
};

const DEMO_RECENT_CANDIDATES = [
    { name: 'Sarah Johnson', email: 'sarah.j@email.com', job: 'Senior Frontend Engineer', stage: 'interview', score: 94, time: '2h ago' },
    { name: 'Marcus Chen', email: 'mchen@email.com', job: 'Product Manager', stage: 'screening', score: 87, time: '4h ago' },
    { name: 'Amira Patel', email: 'amira.p@email.com', job: 'DevOps Engineer', stage: 'applied', score: 91, time: '6h ago' },
    { name: 'James Wilson', email: 'j.wilson@email.com', job: 'Senior Frontend Engineer', stage: 'offer', score: 96, time: '1d ago' },
    { name: 'Elena Rodriguez', email: 'e.rod@email.com', job: 'UX Designer', stage: 'interview', score: 89, time: '1d ago' },
    { name: 'David Kim', email: 'dkim@email.com', job: 'Backend Engineer', stage: 'hired', score: 93, time: '2d ago' },
];

const DEMO_JOBS = [
    { title: 'Senior Frontend Engineer', applications: 52, status: 'open' },
    { title: 'Product Manager', applications: 38, status: 'open' },
    { title: 'DevOps Engineer', applications: 41, status: 'open' },
    { title: 'UX Designer', applications: 29, status: 'open' },
    { title: 'Backend Engineer', applications: 45, status: 'open' },
    { title: 'Data Analyst', applications: 22, status: 'open' },
    { title: 'QA Engineer', applications: 12, status: 'paused' },
    { title: 'Engineering Manager', applications: 8, status: 'open' },
];

const STAGE_LABELS: Record<string, string> = {
    applied: 'Applied',
    screening: 'AI Screening',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
};

const STAGE_VARIANT: Record<string, 'default' | 'success' | 'danger' | 'brand'> = {
    applied: 'default',
    screening: 'default',
    interview: 'brand',
    offer: 'brand',
    hired: 'success',
};

/* ──────────────────────────────────────────
   NAV ITEMS (static for demo)
   ────────────────────────────────────────── */
const sideNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Jobs', icon: Briefcase, active: false },
    { label: 'Workflow', icon: GitMerge, active: false },
    { label: 'Candidates', icon: Users, active: false },
    { label: 'Analytics', icon: BarChart3, active: false },
    { label: 'Settings', icon: Settings, active: false },
];

/* ──────────────────────────────────────────
   DEMO DASHBOARD PAGE
   ────────────────────────────────────────── */
export const DemoDashboardPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired'];
    const maxCount = Math.max(1, ...stages.map(s => DEMO_STAGE_COUNTS[s] || 0));

    return (
        <div className={styles.demoLayout}>
            {/* Demo Banner */}
            <div className={styles.demoBanner}>
                <div className={styles.bannerInner}>
                    <Link to="/ai-recruitment" className={styles.backLink}>
                        <ArrowLeft size={16} />
                        Back to site
                    </Link>
                    <span className={styles.bannerLabel}>
                        🎬 Interactive Demo — Explore with hardcoded data
                    </span>
                    <Link to="/register" className={styles.bannerCta}>
                        Create your own →
                    </Link>
                </div>
            </div>

            <div className={styles.shellWrapper}>
                {/* Sidebar */}
                <aside className={clsx(styles.sidebar, sidebarOpen && styles.sidebarOpen)}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarLogo}>
                            <div className={styles.logoIcon} />
                            <span className={styles.logoText}>AI Recruit</span>
                        </div>
                        <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.companyBadge}>
                        <div className={styles.companyAvatar}>A</div>
                        <span className={styles.companyName}>{DEMO_COMPANY}</span>
                    </div>

                    <nav className={styles.sidebarNav}>
                        <ul className={styles.navList}>
                            {sideNavItems.map(item => (
                                <li key={item.label}>
                                    <div className={clsx(styles.navLink, item.active && styles.navLinkActive)}>
                                        <item.icon size={20} />
                                        <span>{item.label}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <div className={styles.mainWrapper}>
                    {/* Topbar */}
                    <header className={styles.topbar}>
                        <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                        </button>
                        <h1 className={styles.topbarTitle}>{DEMO_COMPANY} Dashboard</h1>
                        <div className={styles.topbarRight}>
                            <div className={styles.avatar}>A</div>
                        </div>
                    </header>

                    {/* Dashboard Content */}
                    <main className={styles.mainContent}>
                        <div className={styles.container}>
                            <div className={styles.dashContainer}>
                                <header className={styles.dashHeader}>
                                    <h1 className={styles.dashTitle}>Overview</h1>
                                    <p className={styles.dashSubtitle}>Here's what's happening at {DEMO_COMPANY} today.</p>
                                </header>

                                {/* Metrics */}
                                <div className={styles.metricsGrid}>
                                    <Card className={styles.metricCard}>
                                        <div className={styles.metricHeader}>
                                            <span className={styles.metricTitle}>Active Jobs</span>
                                            <div className={styles.metricIcon}><Briefcase size={18} /></div>
                                        </div>
                                        <div className={styles.metricBody}>
                                            <span className={styles.metricValue}>{DEMO_STATS.activeJobs}</span>
                                        </div>
                                    </Card>
                                    <Card className={styles.metricCard}>
                                        <div className={styles.metricHeader}>
                                            <span className={styles.metricTitle}>Total Applications</span>
                                            <div className={styles.metricIcon}><Users size={18} /></div>
                                        </div>
                                        <div className={styles.metricBody}>
                                            <span className={styles.metricValue}>{DEMO_STATS.totalApplications}</span>
                                            <span className={styles.trendUp}><TrendingUp size={14} /> +18% this week</span>
                                        </div>
                                    </Card>
                                    <Card className={styles.metricCard}>
                                        <div className={styles.metricHeader}>
                                            <span className={styles.metricTitle}>In Interview</span>
                                            <div className={styles.metricIcon}><FileCheck size={18} /></div>
                                        </div>
                                        <div className={styles.metricBody}>
                                            <span className={styles.metricValue}>{DEMO_STATS.interviewStage}</span>
                                            <span className={styles.trendUp}><TrendingUp size={14} /> {DEMO_STATS.offerStage} in offer</span>
                                        </div>
                                    </Card>
                                </div>

                                {/* Pipeline + Recent Candidates */}
                                <div className={styles.contentGrid}>
                                    {/* Pipeline Chart */}
                                    <Card className={styles.chartCard} padding="lg">
                                        <h3 className={styles.cardTitle}>Application Pipeline</h3>
                                        <div className={styles.chartContainer}>
                                            <div className={styles.barsWrapper}>
                                                {stages.map(stage => {
                                                    const count = DEMO_STAGE_COUNTS[stage] || 0;
                                                    const pct = Math.max(4, (count / maxCount) * 100);
                                                    return (
                                                        <div key={stage} className={styles.barCol}>
                                                            <span className={styles.barCount}>{count}</span>
                                                            <div className={styles.bar} style={{ height: `${pct}%` }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className={styles.barLabels}>
                                                {stages.map(s => <span key={s}>{STAGE_LABELS[s]}</span>)}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Open Jobs */}
                                    <Card className={styles.jobsCard} padding="lg">
                                        <h3 className={styles.cardTitle}>Open Jobs</h3>
                                        <ul className={styles.jobsList}>
                                            {DEMO_JOBS.slice(0, 5).map(job => (
                                                <li key={job.title} className={styles.jobItem}>
                                                    <div>
                                                        <p className={styles.jobTitle}>{job.title}</p>
                                                        <p className={styles.jobApps}>{job.applications} applicants</p>
                                                    </div>
                                                    <Badge variant={job.status === 'open' ? 'success' : 'default'}>
                                                        {job.status === 'open' ? 'Open' : 'Paused'}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                </div>

                                {/* Recent Candidates Table */}
                                <Card padding="none" className={styles.tableCard}>
                                    <div className={styles.tableHeader}>
                                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Recent Candidates</h3>
                                    </div>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Candidate</th>
                                                    <th>Job</th>
                                                    <th>Stage</th>
                                                    <th>AI Score</th>
                                                    <th>Applied</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {DEMO_RECENT_CANDIDATES.map(c => (
                                                    <tr key={c.email}>
                                                        <td>
                                                            <div className={styles.candidateCell}>
                                                                <div className={styles.candidateAvatar}>
                                                                    {c.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className={styles.candidateName}>{c.name}</p>
                                                                    <p className={styles.candidateEmail}>{c.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{c.job}</td>
                                                        <td>
                                                            <Badge variant={STAGE_VARIANT[c.stage] || 'default'}>
                                                                {STAGE_LABELS[c.stage]}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <div className={styles.scoreCell}>
                                                                <Star size={12} className={styles.starIcon} />
                                                                <span>{c.score}%</span>
                                                            </div>
                                                        </td>
                                                        <td className={styles.timeCell}>{c.time}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}
        </div>
    );
};
