import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, GripVertical, Bot, User, Trash2, ArrowRight } from 'lucide-react';
import styles from './WorkflowPage.module.css';

// Mock Workflow Data
const MOCK_STAGES = [
    { id: '1', title: 'Applied', type: 'System', description: 'Initial application received.', aiEnabled: false, isDeletable: false },
    { id: '2', title: 'AI Screening', type: 'Automated', description: 'Resume parsing and skill matching.', aiEnabled: true, isDeletable: false },
    { id: '3', title: 'Hiring Manager Review', type: 'Manual', description: 'Manual review by the hiring manager.', aiEnabled: false, isDeletable: true },
    { id: '4', title: 'Technical Interview', type: 'Manual', description: 'Live coding session and system design.', aiEnabled: false, isDeletable: true },
    { id: '5', title: 'Offer Extended', type: 'System', description: 'Formal offer sent to candidate.', aiEnabled: false, isDeletable: false },
];

export const WorkflowPage = () => {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Workflow Builder</h1>
                    <p className={styles.subtitle}>Design and customize your default recruitment pipeline.</p>
                </div>
                <Button>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Stage
                </Button>
            </header>

            {/* Main Content */}
            <div className={styles.content}>
                <div className={styles.pipeline}>
                    {MOCK_STAGES.map((stage, index) => (
                        <React.Fragment key={stage.id}>
                            {/* Stage Card */}
                            <Card className={styles.stageCard} padding="md">
                                <div className={styles.dragHandle}>
                                    <GripVertical size={20} />
                                </div>

                                <div className={styles.stageContent}>
                                    <div className={styles.stageHeader}>
                                        <div className={styles.stageTitleGroup}>
                                            <h3 className={styles.stageTitle}>{stage.title}</h3>
                                            <Badge variant={stage.type === 'Automated' ? 'brand' : stage.type === 'System' ? 'default' : 'warning'}>
                                                {stage.type}
                                            </Badge>
                                        </div>
                                        {/* Actions */}
                                        <div className={styles.stageActions}>
                                            <div className={styles.toggleWrapper}>
                                                {stage.aiEnabled ? (
                                                    <Bot size={16} className={styles.aiIcon} />
                                                ) : (
                                                    <User size={16} className={styles.manualIcon} />
                                                )}
                                                <span className={styles.toggleLabel}>
                                                    {stage.aiEnabled ? 'AI Task' : 'Manual'}
                                                </span>
                                            </div>

                                            {stage.isDeletable && (
                                                <button className={styles.deleteBtn} aria-label="Delete stage">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className={styles.stageDesc}>{stage.description}</p>
                                </div>
                            </Card>

                            {/* Connector */}
                            {index < MOCK_STAGES.length - 1 && (
                                <div className={styles.connector}>
                                    <ArrowRight size={20} className={styles.connectorArrow} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Sidebar Info/Properties panel mockup */}
                <aside className={styles.propertiesPanel}>
                    <Card padding="lg" className={styles.infoCard}>
                        <h3 className={styles.panelTitle}>Pipeline Settings</h3>
                        <p className={styles.panelDesc}>
                            This is your global default workflow. You can override these stages on a per-job basis.
                        </p>
                        <div className={styles.statsList}>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Total Stages:</span>
                                <span className={styles.statVal}>5</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Automated:</span>
                                <span className={styles.statVal}>1</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Manual:</span>
                                <span className={styles.statVal}>2</span>
                            </div>
                        </div>
                        <div className={styles.panelDivider} />
                        <Button variant="outline" fullWidth>Save Changes</Button>
                    </Card>
                </aside>
            </div>
        </div>
    );
};
