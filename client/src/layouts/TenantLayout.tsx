import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import styles from './TenantLayout.module.css';

export const TenantLayout = () => {
    const { companyName } = useParams<{ companyName: string }>();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={styles.layout}>
            <Sidebar
                companyName={companyName || 'Company'}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className={styles.mainWrapper}>
                <Topbar
                    companyName={companyName || 'Company'}
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
