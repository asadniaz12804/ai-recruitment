// src/modules/jobs/JobCreateModal.tsx
import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { X } from 'lucide-react';
import { createJob, updateJob, type Job, type CreateJobPayload } from '../../lib/jobs';
import styles from './JobCreateModal.module.css';

interface JobCreateModalProps {
    onClose: () => void;
    editJob?: Job | null;
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead'];
const STATUSES = ['draft', 'open', 'closed'];

export const JobCreateModal: React.FC<JobCreateModalProps> = ({ onClose, editJob }) => {
    const queryClient = useQueryClient();
    const isEdit = !!editJob;

    const [title, setTitle] = useState(editJob?.title ?? '');
    const [description, setDescription] = useState(editJob?.description ?? '');
    const [location, setLocation] = useState(editJob?.location ?? '');
    const [employmentType, setEmploymentType] = useState(editJob?.employmentType ?? 'full-time');
    const [remote, setRemote] = useState(editJob?.remote ?? false);
    const [seniority, setSeniority] = useState(editJob?.seniority ?? '');
    const [salaryMin, setSalaryMin] = useState(editJob?.salaryMin?.toString() ?? '');
    const [salaryMax, setSalaryMax] = useState(editJob?.salaryMax?.toString() ?? '');
    const [currency, setCurrency] = useState(editJob?.currency ?? 'USD');
    const [skillsRaw, setSkillsRaw] = useState(editJob?.skillsRequired?.join(', ') ?? '');
    const [status, setStatus] = useState(editJob?.status ?? 'draft');
    const [apiError, setApiError] = useState('');

    const mut = useMutation({
        mutationFn: (payload: CreateJobPayload) =>
            isEdit ? updateJob(editJob!.id, payload) : createJob(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
            onClose();
        },
        onError: (err: unknown) => {
            setApiError(err instanceof Error ? err.message : 'Something went wrong');
        },
    });

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setApiError('');

            const payload: CreateJobPayload = {
                title: title.trim(),
                description: description.trim(),
                employmentType,
                remote,
                status,
            };
            if (location.trim()) payload.location = location.trim();
            if (seniority) payload.seniority = seniority;
            if (salaryMin) payload.salaryMin = Number(salaryMin);
            if (salaryMax) payload.salaryMax = Number(salaryMax);
            if (currency) payload.currency = currency;
            const skills = skillsRaw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (skills.length) payload.skillsRequired = skills;

            mut.mutate(payload);
        },
        [title, description, location, employmentType, remote, seniority, salaryMin, salaryMax, currency, skillsRaw, status, mut]
    );

    return (
        <div className={styles.overlay}>
            <Card padding="none" className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>{isEdit ? 'Edit Job' : 'Create New Job'}</h2>
                        <p className={styles.subtitle}>{isEdit ? 'Update the job details.' : 'Fill out the details to post a new opening.'}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className={styles.body}>
                        {apiError && <div style={{ color: 'var(--danger-600)', marginBottom: '1rem', fontSize: 'var(--text-sm)' }}>{apiError}</div>}

                        <div className={styles.formGrid}>
                            <Input label="Job Title" placeholder="e.g. Senior Product Manager" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} required />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <label className={styles.label}>Employment Type</label>
                                <select className={styles.textarea} style={{ minHeight: 'auto', resize: 'none', padding: '8px 12px' }} value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className={styles.fullSpan}>
                                <Input label="Location" placeholder="e.g. Remote, or New York, NY" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} />
                            </div>

                            <div className={styles.fullSpan} style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <input type="checkbox" id="remote-toggle" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
                                <label htmlFor="remote-toggle" className={styles.label} style={{ margin: 0 }}>Remote position</label>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <label className={styles.label}>Seniority</label>
                                <select className={styles.textarea} style={{ minHeight: 'auto', resize: 'none', padding: '8px 12px' }} value={seniority} onChange={(e) => setSeniority(e.target.value)}>
                                    <option value="">Not specified</option>
                                    {SENIORITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                <label className={styles.label}>Status</label>
                                <select className={styles.textarea} style={{ minHeight: 'auto', resize: 'none', padding: '8px 12px' }} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <Input label="Salary Min" type="number" placeholder="50000" fullWidth value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                            <Input label="Salary Max" type="number" placeholder="150000" fullWidth value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />

                            <Input label="Currency" placeholder="USD" fullWidth value={currency} onChange={(e) => setCurrency(e.target.value)} />

                            <div className={styles.fullSpan}>
                                <Input label="Skills (comma-separated)" placeholder="React, TypeScript, Node.js" fullWidth value={skillsRaw} onChange={(e) => setSkillsRaw(e.target.value)} />
                            </div>

                            <div className={styles.fullSpan}>
                                <label className={styles.label}>Job Description</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={4}
                                    placeholder="Briefly describe the role and responsibilities..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={mut.isPending}>
                            {mut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Job'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
