import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import styles from './TenantLayout.module.css';

export const TenantLayout = () => {
    const { companySlug } = useParams<{ companySlug: string }>();
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Use the user's company name for display, slug for routing
    const displayName = user?.companyName || companySlug || 'Company';

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={styles.layout}>
            <Sidebar
                companyName={displayName}
                companySlug={companySlug || ''}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className={styles.mainWrapper}>
                <Topbar
                    companyName={displayName}
                    onMenuClick={toggleSidebar}
                />
                <main className={styles.mainContent}>
                    <div className={styles.container}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};
