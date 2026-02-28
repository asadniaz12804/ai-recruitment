
import { Card } from '../components/ui/Card';
import { Users, Briefcase, MousePointerClick, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import styles from './DashboardOverview.module.css';

export const DashboardOverview = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Overview</h1>
                <p className={styles.subtitle}>Here is what's happening today.</p>
            </header>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Active Jobs</span>
                        <div className={styles.metricIconWrapper}>
                            <Briefcase size={18} className={styles.metricIcon} />
                        </div>
                    </div>
                    <div className={styles.metricBody}>
                        <span className={styles.metricValue}>12</span>
                        <span className={clsx(styles.metricTrend, styles.trendUp)}>
                            <TrendingUp size={14} /> +2 this week
                        </span>
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Total Candidates</span>
                        <div className={styles.metricIconWrapper}>
                            <Users size={18} className={styles.metricIcon} />
                        </div>
                    </div>
                    <div className={styles.metricBody}>
                        <span className={styles.metricValue}>1,248</span>
                        <span className={clsx(styles.metricTrend, styles.trendUp)}>
                            <TrendingUp size={14} /> +154 this week
                        </span>
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Interviews Scheduled</span>
                        <div className={styles.metricIconWrapper}>
                            <MousePointerClick size={18} className={styles.metricIcon} />
                        </div>
                    </div>
                    <div className={styles.metricBody}>
                        <span className={styles.metricValue}>24</span>
                        <span className={styles.metricTrend}>
                            Stable
                        </span>
                    </div>
                </Card>
            </div>

            {/* Recent Activity / Next Steps area */}
            <div className={styles.contentGrid}>
                <Card className={styles.chartCard} padding="lg">
                    <h3 className={styles.cardTitle}>Application Pipeline</h3>
                    <div className={styles.chartPlaceholder}>
                        <div className={styles.placeholderBars}>
                            <div className={styles.bar} style={{ height: '100%' }} />
                            <div className={styles.bar} style={{ height: '70%' }} />
                            <div className={styles.bar} style={{ height: '40%' }} />
                            <div className={styles.bar} style={{ height: '15%' }} />
                        </div>
                        <div className={styles.placeholderLabels}>
                            <span>Applied</span>
                            <span>Screened</span>
                            <span>Interview</span>
                            <span>Offer</span>
                        </div>
                    </div>
                </Card>

                <Card className={styles.activityCard} padding="lg">
                    <h3 className={styles.cardTitle}>Recent Activity</h3>
                    <ul className={styles.activityList}>
                        <li className={styles.activityItem}>
                            <div className={styles.activityDot} />
                            <div className={styles.activityText}>
                                <p><strong>Sarah Jenkins</strong> moved to Technical Interview</p>
                                <span className={styles.activityMeta}>2 hours ago</span>
                            </div>
                        </li>
                        <li className={styles.activityItem}>
                            <div className={styles.activityDot} />
                            <div className={styles.activityText}>
                                <p><strong>Frontend Engineer</strong> job posting published</p>
                                <span className={styles.activityMeta}>5 hours ago</span>
                            </div>
                        </li>
                        <li className={styles.activityItem}>
                            <div className={styles.activityDot} />
                            <div className={styles.activityText}>
                                <p><strong>Michael Chen</strong> accepted Offer</p>
                                <span className={styles.activityMeta}>1 day ago</span>
                            </div>
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};
