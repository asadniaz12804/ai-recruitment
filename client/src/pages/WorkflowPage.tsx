import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, GripVertical, Bot, User, Trash2, ArrowRight, X, Check } from 'lucide-react';
import styles from './WorkflowPage.module.css';

interface Stage {
    id: string;
    title: string;
    type: 'System' | 'Automated' | 'Manual';
    description: string;
    aiEnabled: boolean;
    isDeletable: boolean;
}

const DEFAULT_STAGES: Stage[] = [
    { id: '1', title: 'Applied', type: 'System', description: 'Initial application received.', aiEnabled: false, isDeletable: false },
    { id: '2', title: 'AI Screening', type: 'Automated', description: 'Resume parsing and skill matching.', aiEnabled: true, isDeletable: false },
    { id: '3', title: 'Hiring Manager Review', type: 'Manual', description: 'Manual review by the hiring manager.', aiEnabled: false, isDeletable: true },
    { id: '4', title: 'Technical Interview', type: 'Manual', description: 'Live coding session and system design.', aiEnabled: false, isDeletable: true },
    { id: '5', title: 'Offer Extended', type: 'System', description: 'Formal offer sent to candidate.', aiEnabled: false, isDeletable: false },
];

let nextId = 6;

export const WorkflowPage = () => {
    const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState<'Manual' | 'Automated'>('Manual');
    const [saved, setSaved] = useState(false);

    const handleAddStage = useCallback(() => {
        if (!newTitle.trim()) return;
        const stage: Stage = {
            id: String(nextId++),
            title: newTitle.trim(),
            description: newDesc.trim() || `Custom stage: ${newTitle.trim()}`,
            type: newType,
            aiEnabled: newType === 'Automated',
            isDeletable: true,
        };
        // Insert before the last stage (Offer Extended)
        setStages((prev) => {
            const copy = [...prev];
            copy.splice(copy.length - 1, 0, stage);
            return copy;
        });
        setNewTitle('');
        setNewDesc('');
        setNewType('Manual');
        setShowAddModal(false);
    }, [newTitle, newDesc, newType]);

    const handleDelete = useCallback((id: string) => {
        setStages((prev) => prev.filter((s) => s.id !== id));
    }, []);

    const toggleAi = useCallback((id: string) => {
        setStages((prev) =>
            prev.map((s) =>
                s.id === id
                    ? { ...s, aiEnabled: !s.aiEnabled, type: !s.aiEnabled ? 'Automated' : 'Manual' }
                    : s
            )
        );
    }, []);

    const handleSave = useCallback(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, []);

    const totalStages = stages.length;
    const automatedCount = stages.filter((s) => s.aiEnabled).length;
    const manualCount = stages.filter((s) => s.type === 'Manual').length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Workflow Builder</h1>
                    <p className={styles.subtitle}>Design and customize your default recruitment pipeline.</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Stage
                </Button>
            </header>

            {/* Main Content */}
            <div className={styles.content}>
                <div className={styles.pipeline}>
                    {stages.map((stage, index) => (
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
                                            <button
                                                className={styles.toggleWrapper}
                                                onClick={() => stage.isDeletable && toggleAi(stage.id)}
                                                style={{ cursor: stage.isDeletable ? 'pointer' : 'default' }}
                                                title={stage.isDeletable ? 'Toggle AI / Manual' : ''}
                                            >
                                                {stage.aiEnabled ? (
                                                    <Bot size={16} className={styles.aiIcon} />
                                                ) : (
                                                    <User size={16} className={styles.manualIcon} />
                                                )}
                                                <span className={styles.toggleLabel}>
                                                    {stage.aiEnabled ? 'AI Task' : 'Manual'}
                                                </span>
                                            </button>

                                            {stage.isDeletable && (
                                                <button
                                                    className={styles.deleteBtn}
                                                    aria-label="Delete stage"
                                                    onClick={() => handleDelete(stage.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className={styles.stageDesc}>{stage.description}</p>
                                </div>
                            </Card>

                            {/* Connector */}
                            {index < stages.length - 1 && (
                                <div className={styles.connector}>
                                    <ArrowRight size={20} className={styles.connectorArrow} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Sidebar Info/Properties panel */}
                <aside className={styles.propertiesPanel}>
                    <Card padding="lg" className={styles.infoCard}>
                        <h3 className={styles.panelTitle}>Pipeline Settings</h3>
                        <p className={styles.panelDesc}>
                            This is your global default workflow. You can override these stages on a per-job basis.
                        </p>
                        <div className={styles.statsList}>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Total Stages:</span>
                                <span className={styles.statVal}>{totalStages}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Automated:</span>
                                <span className={styles.statVal}>{automatedCount}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Manual:</span>
                                <span className={styles.statVal}>{manualCount}</span>
                            </div>
                        </div>
                        <div className={styles.panelDivider} />
                        <Button variant={saved ? 'primary' : 'outline'} fullWidth onClick={handleSave}>
                            {saved ? <><Check size={16} style={{ marginRight: 6 }} /> Saved!</> : 'Save Changes'}
                        </Button>
                    </Card>
                </aside>
            </div>

            {/* Add Stage Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <Card padding="none" className={styles.addModal} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add Pipeline Stage</h2>
                            <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form
                            className={styles.modalBody}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAddStage();
                            }}
                        >
                            <div className={styles.modalField}>
                                <label className={styles.modalLabel}>Stage Name *</label>
                                <input
                                    className={styles.modalInput}
                                    placeholder="e.g. Phone Screen"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label className={styles.modalLabel}>Description</label>
                                <input
                                    className={styles.modalInput}
                                    placeholder="Brief description of this stage"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label className={styles.modalLabel}>Type</label>
                                <div className={styles.typeToggle}>
                                    <button
                                        type="button"
                                        className={`${styles.typeOption} ${newType === 'Manual' ? styles.typeActive : ''}`}
                                        onClick={() => setNewType('Manual')}
                                    >
                                        <User size={16} /> Manual
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.typeOption} ${newType === 'Automated' ? styles.typeActive : ''}`}
                                        onClick={() => setNewType('Automated')}
                                    >
                                        <Bot size={16} /> Automated (AI)
                                    </button>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={!newTitle.trim()}>Add Stage</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
