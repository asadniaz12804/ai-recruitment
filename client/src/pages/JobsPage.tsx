import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { JobCreateModal } from '../modules/jobs/JobCreateModal';
import styles from './JobsPage.module.css';

// Mock Data
const MOCK_JOBS = [
    { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', applicants: 142, status: 'Active', matchRate: '92%' },
    { id: '2', title: 'Product Manager', department: 'Product', location: 'New York', applicants: 84, status: 'Active', matchRate: '88%' },
    { id: '3', title: 'DevOps Specialist', department: 'Engineering', location: 'Remote', applicants: 0, status: 'Draft', matchRate: '--' },
    { id: '4', title: 'UX Designer', department: 'Design', location: 'London', applicants: 215, status: 'Closed', matchRate: '75%' },
];

export const JobsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Jobs</h1>
                    <p className={styles.subtitle}>Manage your active postings and drafts.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Create Job
                </Button>
            </header>

            <Card padding="none" className={styles.tableCard}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <Search size={18} className={styles.searchIcon} />
                        <input type="text" placeholder="Search jobs..." className={styles.searchInput} />
                    </div>
                    <div className={styles.filters}>
                        <Button variant="outline" size="sm">Filter</Button>
                    </div>
                </div>

                {/* Table -> Stacks to Cards on Mobile */}
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Job Title</th>
                                <th>Status</th>
                                <th>Applicants</th>
                                <th>Avg. AI Match</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_JOBS.map(job => (
                                <tr key={job.id}>
                                    <td>
                                        <div className={styles.jobInfo}>
                                            <span className={styles.jobTitle}>{job.title}</span>
                                            <span className={styles.jobMeta}>{job.department} • {job.location}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge
                                            variant={job.status === 'Active' ? 'success' : job.status === 'Draft' ? 'warning' : 'default'}
                                        >
                                            {job.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <span className={styles.applicantCount}>{job.applicants}</span>
                                    </td>
                                    <td>
                                        {job.matchRate !== '--' ? (
                                            <Badge variant="brand">{job.matchRate}</Badge>
                                        ) : (
                                            <span className={styles.emptyDash}>--</span>
                                        )}
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <button className={styles.actionBtn} aria-label="More actions">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modals */}
            {isModalOpen && <JobCreateModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};
