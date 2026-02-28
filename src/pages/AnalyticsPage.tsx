import { Card } from '../components/ui/Card';

import styles from './AnalyticsPage.module.css';

export const AnalyticsPage = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analytics</h1>
                    <p className={styles.subtitle}>Measure your hiring performance and AI efficiency.</p>
                </div>

                <div className={styles.controls}>
                    <select className={styles.timeSelect}>
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                        <option>All Time</option>
                    </select>
                </div>
            </header>

            {/* Top Level KPIs */}
            <div className={styles.kpiGrid}>
                <Card className={styles.kpiCard}>
                    <h3 className={styles.kpiLabel}>Time to Hire (Avg)</h3>
                    <div className={styles.kpiValueGroup}>
                        <span className={styles.kpiValue}>18<span className={styles.kpiUnit}>days</span></span>
                        <span className={styles.kpiTrendPos}>-4 days v. last month</span>
                    </div>
                </Card>

                <Card className={styles.kpiCard}>
                    <h3 className={styles.kpiLabel}>Offer Acceptance Rate</h3>
                    <div className={styles.kpiValueGroup}>
                        <span className={styles.kpiValue}>84<span className={styles.kpiUnit}>%</span></span>
                        <span className={styles.kpiTrendPos}>+2% v. last month</span>
                    </div>
                </Card>

                <Card className={styles.kpiCard}>
                    <h3 className={styles.kpiLabel}>Cost per Hire (Est.)</h3>
                    <div className={styles.kpiValueGroup}>
                        <span className={styles.kpiValue}>$4,200</span>
                        <span className={styles.kpiTrendNeg}>+$300 v. last month</span>
                    </div>
                </Card>

                <Card className={styles.kpiCard}>
                    <h3 className={styles.kpiLabel}>AI Screening Time Saved</h3>
                    <div className={styles.kpiValueGroup}>
                        <span className={styles.kpiValue}>124<span className={styles.kpiUnit}>hrs</span></span>
                        <span className={styles.kpiTrendPos}>+12 hrs v. last month</span>
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
                        <div className={styles.funnelRow}>
                            <div className={styles.funnelLabel}>Applied</div>
                            <div className={styles.funnelBarArea}>
                                <div className={styles.funnelBar} style={{ width: '100%', backgroundColor: 'var(--primary-200)' }}>1,248</div>
                            </div>
                        </div>
                        <div className={styles.funnelRow}>
                            <div className={styles.funnelLabel}>Screened</div>
                            <div className={styles.funnelBarArea}>
                                <div className={styles.funnelBar} style={{ width: '45%', backgroundColor: 'var(--primary-400)' }}>560</div>
                            </div>
                        </div>
                        <div className={styles.funnelRow}>
                            <div className={styles.funnelLabel}>Interview</div>
                            <div className={styles.funnelBarArea}>
                                <div className={styles.funnelBar} style={{ width: '15%', backgroundColor: 'var(--primary-600)' }}>187</div>
                            </div>
                        </div>
                        <div className={styles.funnelRow}>
                            <div className={styles.funnelLabel}>Offer</div>
                            <div className={styles.funnelBarArea}>
                                <div className={styles.funnelBar} style={{ width: '4%', backgroundColor: 'var(--primary-800)' }}>45</div>
                            </div>
                        </div>
                        <div className={styles.funnelRow}>
                            <div className={styles.funnelLabel}>Hired</div>
                            <div className={styles.funnelBarArea}>
                                <div className={styles.funnelBar} style={{ width: '3%', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>38</div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Source of truth / Pie mockup */}
                <Card padding="lg" className={styles.chartWrapper}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Top Candidate Sources</h3>
                    </div>
                    <div className={styles.sourceList}>
                        <div className={styles.sourceItem}>
                            <div className={styles.sourceInfo}>
                                <div className={styles.sourceColor} style={{ backgroundColor: 'var(--primary-600)' }} />
                                <span className={styles.sourceName}>LinkedIn</span>
                            </div>
                            <span className={styles.sourceMetric}>42%</span>
                        </div>
                        <div className={styles.sourceItem}>
                            <div className={styles.sourceInfo}>
                                <div className={styles.sourceColor} style={{ backgroundColor: 'var(--primary-400)' }} />
                                <span className={styles.sourceName}>Careers Page</span>
                            </div>
                            <span className={styles.sourceMetric}>28%</span>
                        </div>
                        <div className={styles.sourceItem}>
                            <div className={styles.sourceInfo}>
                                <div className={styles.sourceColor} style={{ backgroundColor: 'var(--primary-300)' }} />
                                <span className={styles.sourceName}>Referrals</span>
                            </div>
                            <span className={styles.sourceMetric}>18%</span>
                        </div>
                        <div className={styles.sourceItem}>
                            <div className={styles.sourceInfo}>
                                <div className={styles.sourceColor} style={{ backgroundColor: 'var(--surface-active)' }} />
                                <span className={styles.sourceName}>Other Job Boards</span>
                            </div>
                            <span className={styles.sourceMetric}>12%</span>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
};
