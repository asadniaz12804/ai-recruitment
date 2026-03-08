import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UploadCloud, CheckCircle2, MapPin, Briefcase } from 'lucide-react';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import styles from './PublicJobPage.module.css';

export const PublicJobPage = () => {
    const { companyName, jobSlug } = useParams<{ companyName: string, jobSlug: string }>();

    // Mock processing of slug to title
    const formattedJobTitle = jobSlug
        ? jobSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'Open Position';

    const formattedCompany = companyName
        ? companyName.charAt(0).toUpperCase() + companyName.slice(1)
        : 'Company';

    return (
        <div className={styles.wrapper}>
            {/* Public Navbar Minimal */}
            <header className={styles.navbar}>
                <div className={styles.navContainer}>
                    <div className={styles.companyBrand}>
                        <div className={styles.companyAvatar}>{formattedCompany.charAt(0)}</div>
                        <span className={styles.companyNameText}>{formattedCompany} Careers</span>
                    </div>
                    <div className={styles.navActions}>
                        <ThemeToggle />
                        <Link to="/ai-recruitment" className={styles.poweredBy}>
                            Powered by AI Recruit
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Form Content */}
            <main className={styles.main}>
                <div className={styles.jobHeader}>
                    <h1 className={styles.jobTitle}>{formattedJobTitle}</h1>
                    <div className={styles.jobMeta}>
                        <span className={styles.metaItem}>
                            <Briefcase size={16} /> Engineering
                        </span>
                        <span className={styles.metaItem}>
                            <MapPin size={16} /> Remote
                        </span>
                        <span className={styles.metaItem}>
                            <CheckCircle2 size={16} /> Full-time
                        </span>
                    </div>
                </div>

                <div className={styles.grid}>
                    {/* Left Column - Description */}
                    <div className={styles.descriptionCol}>
                        <h2 className={styles.sectionTitle}>About the Role</h2>
                        <div className={styles.prose}>
                            <p>We are looking for a highly skilled {formattedJobTitle} to join our fast-growing team. You will be responsible for building scalable, high-performance web applications using modern technologies.</p>

                            <h3>Responsibilities</h3>
                            <ul>
                                <li>Develop and maintain responsive user interfaces.</li>
                                <li>Collaborate with cross-functional teams to define and ship new features.</li>
                                <li>Identify and resolve performance and scalability issues.</li>
                            </ul>

                            <h3>Requirements</h3>
                            <ul>
                                <li>3+ years of experience with React and TypeScript.</li>
                                <li>Strong understanding of CSS Architecture and modern design systems.</li>
                                <li>Experience with state management and API integrations.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column - Application Form */}
                    <div className={styles.formCol}>
                        <Card padding="lg" className={styles.applyCard}>
                            <h2 className={styles.formTitle}>Apply for this job</h2>
                            <form className={styles.form}>

                                {/* Resume Upload Box */}
                                <div className={styles.uploadArea}>
                                    <UploadCloud size={32} className={styles.uploadIcon} />
                                    <p className={styles.uploadText}><strong>Click to upload</strong> or drag and drop</p>
                                    <p className={styles.uploadSub}>PDF, DOCX up to 10MB</p>
                                </div>

                                <div className={styles.formGrid}>
                                    <Input label="First Name" placeholder="Jane" />
                                    <Input label="Last Name" placeholder="Doe" />

                                    <div className={styles.fullSpan}>
                                        <Input label="Email" type="email" placeholder="jane@example.com" fullWidth />
                                    </div>

                                    <div className={styles.fullSpan}>
                                        <Input label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" fullWidth />
                                    </div>

                                    <div className={styles.fullSpan}>
                                        <Input label="LinkedIn Profile URL" placeholder="https://linkedin.com/in/..." fullWidth />
                                    </div>

                                    <div className={styles.fullSpan}>
                                        <Input label="Portfolio / GitHub URL" placeholder="https://github.com/..." fullWidth />
                                    </div>
                                </div>

                                <div className={styles.submitArea}>
                                    <Button variant="primary" size="lg" fullWidth>Submit Application</Button>
                                    <p className={styles.termsText}>
                                        By applying, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};
