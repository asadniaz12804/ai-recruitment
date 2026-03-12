
import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, Briefcase, FileCheck, TrendingUp, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { recruiterListJobs } from '../lib/jobs';
import { recruiterListApplications } from '../lib/applications';
import styles from './DashboardOverview.module.css';

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  interviewStage: number;
  offerStage: number;
  stageCounts: Record<string, number>;
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch all open jobs count
        const jobsRes = await recruiterListJobs({ limit: 1, status: 'open' });
        const activeJobs = jobsRes.pagination.total;

        // Fetch ALL recruiter jobs (any status) to aggregate applications
        const allJobsRes = await recruiterListJobs({ limit: 100 });
        const allJobs = allJobsRes.items;

        // Fetch applications for every job
        const appResults = await Promise.all(
          allJobs.map((job) =>
            recruiterListApplications(job.id, { limit: 200 }).catch(() => ({ items: [], pagination: { total: 0 } }))
          )
        );

        const stageCounts: Record<string, number> = {};
        let totalApplications = 0;
        for (const res of appResults) {
          totalApplications += res.items.length;
          for (const app of res.items) {
            stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1;
          }
        }

        setStats({
          activeJobs,
          totalApplications,
          interviewStage: stageCounts['interview'] || 0,
          offerStage: stageCounts['offer'] || 0,
          stageCounts,
        });
      } catch {
        // silently fallback to zero stats
        setStats({ activeJobs: 0, totalApplications: 0, interviewStage: 0, offerStage: 0, stageCounts: {} });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stages = ['applied', 'screening', 'interview', 'offer', 'hired'];
  const maxCount = stats ? Math.max(1, ...stages.map(s => stats.stageCounts[s] || 0)) : 1;

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
              <Briefcase size={18} />
            </div>
          </div>
          <div className={styles.metricBody}>
            {loading ? (
              <Loader2 size={20} className={styles.spinner} />
            ) : (
              <span className={styles.metricValue}>{stats?.activeJobs ?? 0}</span>
            )}
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Total Applications</span>
            <div className={styles.metricIconWrapper}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.metricBody}>
            {loading ? (
              <Loader2 size={20} className={styles.spinner} />
            ) : (
              <span className={styles.metricValue}>{stats?.totalApplications ?? 0}</span>
            )}
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>In Interview</span>
            <div className={styles.metricIconWrapper}>
              <FileCheck size={18} />
            </div>
          </div>
          <div className={styles.metricBody}>
            {loading ? (
              <Loader2 size={20} className={styles.spinner} />
            ) : (
              <>
                <span className={styles.metricValue}>{stats?.interviewStage ?? 0}</span>
                {(stats?.offerStage ?? 0) > 0 && (
                  <span className={clsx(styles.metricTrend, styles.trendUp)}>
                    <TrendingUp size={14} /> {stats?.offerStage} in offer
                  </span>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Pipeline visualization */}
      <div className={styles.contentGrid}>
        <Card className={styles.chartCard} padding="lg">
          <h3 className={styles.cardTitle}>Application Pipeline</h3>
          {loading ? (
            <div className={styles.chartLoading}><Loader2 size={24} className={styles.spinner} /></div>
          ) : (
            <div className={styles.chartPlaceholder}>
              <div className={styles.placeholderBars}>
                {stages.map((stage) => {
                  const count = stats?.stageCounts[stage] || 0;
                  const pct = Math.max(4, (count / maxCount) * 100);
                  return (
                    <div key={stage} className={styles.barCol}>
                      <span className={styles.barCount}>{count}</span>
                      <div className={styles.bar} style={{ height: `${pct}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className={styles.placeholderLabels}>
                {stages.map(s => <span key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>)}
              </div>
            </div>
          )}
        </Card>

        <Card className={styles.activityCard} padding="lg">
          <h3 className={styles.cardTitle}>Quick Stats</h3>
          <ul className={styles.activityList}>
            {stages.map(stage => (
              <li key={stage} className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div className={styles.activityText}>
                  <p><strong>{stats?.stageCounts[stage] || 0}</strong> candidates in <strong>{stage}</strong></p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
