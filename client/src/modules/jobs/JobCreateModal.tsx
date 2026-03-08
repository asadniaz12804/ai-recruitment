// src/modules/jobs/JobCreateModal.tsx
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X, Bot } from 'lucide-react';
import styles from './JobCreateModal.module.css';

interface JobCreateModalProps {
    onClose: () => void;
}

export const JobCreateModal: React.FC<JobCreateModalProps> = ({ onClose }) => {
    const [aiEnabled, setAiEnabled] = useState(true);

    return (
        <div className={styles.overlay}>
            <Card padding="none" className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Create New Job</h2>
                        <p className={styles.subtitle}>Fill out the details to post a new opening.</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <div className={styles.formGrid}>
                        <Input label="Job Title" placeholder="e.g. Senior Product Manager" fullWidth />
                        <Input label="Department" placeholder="e.g. Product" fullWidth />

                        <div className={styles.fullSpan}>
                            <Input label="Location" placeholder="e.g. Remote, or New York, NY" fullWidth />
                        </div>

                        <div className={styles.fullSpan}>
                            <label className={styles.label}>Job Description</label>
                            <textarea
                                className={styles.textarea}
                                rows={4}
                                placeholder="Briefly describe the role and responsibilities..."
                            />
                        </div>

                        {/* AI Toggle Section */}
                        <div className={styles.fullSpan}>
                            <div className={styles.aiBox}>
                                <div className={styles.aiBoxLeft}>
                                    <div className={styles.aiIconWrapper}>
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <h4 className={styles.aiBoxTitle}>AI Screening</h4>
                                        <p className={styles.aiBoxDesc}>Automatically parse resumes and score candidates based on this job.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={`${styles.toggle} ${aiEnabled ? styles.toggleActive : ''}`}
                                    onClick={() => setAiEnabled(!aiEnabled)}
                                    aria-pressed={aiEnabled}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="primary">Create Job</Button>
                </div>
            </Card>
        </div>
    );
};
