import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Search, Filter, Star, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import styles from './CandidatesPage.module.css';

// Mock Data
const STAGES = ['Applied', 'AI Screening', 'Hiring Manager Review', 'Technical Interview', 'Offer'];

const MOCK_CANDIDATES = [
    { id: '1', name: 'Sarah Jenkins', role: 'Frontend Engineer', stage: 'Technical Interview', aiScore: 92, appliedAt: '2d ago' },
    { id: '2', name: 'Michael Chen', role: 'Frontend Engineer', stage: 'Offer', aiScore: 95, appliedAt: '1w ago' },
    { id: '3', name: 'Emma Watson', role: 'Product Manager', stage: 'Applied', aiScore: null, appliedAt: '1h ago' },
    { id: '4', name: 'James Rodriguez', role: 'UX Designer', stage: 'AI Screening', aiScore: 88, appliedAt: '5h ago' },
    { id: '5', name: 'Priya Patel', role: 'Frontend Engineer', stage: 'Hiring Manager Review', aiScore: 78, appliedAt: '3d ago' },
];

export const CandidatesPage = () => {
    const [activeTab, setActiveTab] = useState<'board' | 'list'>('board');

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
                    <Button variant="primary">Add Candidate</Button>
                </div>
            </header>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input type="text" placeholder="Search candidates by name, role, or skills..." className={styles.searchInput} />
                </div>
                <div className={styles.filters}>
                    <select className={styles.select}>
                        <option>All Jobs</option>
                        <option>Frontend Engineer</option>
                        <option>Product Manager</option>
                        <option>UX Designer</option>
                    </select>
                    <Button variant="outline" size="sm">
                        <Filter size={16} style={{ marginRight: '6px' }} /> Filters
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            {activeTab === 'board' && (
                <div className={styles.boardScrollContainer}>
                    <div className={styles.board}>
                        {STAGES.map(stage => {
                            const stageCandidates = MOCK_CANDIDATES.filter(c => c.stage === stage);

                            return (
                                <div key={stage} className={styles.column}>
                                    <div className={styles.columnHeader}>
                                        <h3 className={styles.columnTitle}>{stage}</h3>
                                        <span className={styles.columnCount}>{stageCandidates.length}</span>
                                    </div>

                                    <div className={styles.columnContent}>
                                        {stageCandidates.map(candidate => (
                                            <Card key={candidate.id} padding="md" className={styles.candidateCard} interactive>
                                                <div className={styles.cardHeader}>
                                                    <h4 className={styles.candidateName}>{candidate.name}</h4>
                                                    <button className={styles.iconBtn} aria-label="Quick actions"><ExternalLink size={14} /></button>
                                                </div>

                                                <p className={styles.candidateRole}>{candidate.role}</p>

                                                <div className={styles.cardMeta}>
                                                    {candidate.aiScore ? (
                                                        <div className={styles.scoreWrapper}>
                                                            <Star size={12} className={styles.starIcon} />
                                                            <span className={styles.scoreText}>{candidate.aiScore} Match</span>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.timeText}>{candidate.appliedAt}</span>
                                                    )}

                                                    <div className={styles.avatarGroup}>
                                                        <div className={styles.miniAvatar}>
                                                            {candidate.name.charAt(0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* List View Fallback (Mock) */}
            {activeTab === 'list' && (
                <Card padding="lg" className={styles.listEmptyState}>
                    <p className={styles.emptyText}>List view implementation goes here. Switch back to Board View for the Demo.</p>
                </Card>
            )}
        </div>
    );
};
