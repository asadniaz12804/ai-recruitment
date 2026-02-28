// src/components/layout/Topbar.tsx
import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import styles from './Topbar.module.css';

interface TopbarProps {
    companyName: string;
    onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ companyName, onMenuClick }) => {
    return (
        <header className={styles.topbar}>
            <div className={styles.left}>
                <button
                    className={styles.menuBtn}
                    onClick={onMenuClick}
                    aria-label="Open sidebar"
                >
                    <Menu size={24} />
                </button>
                <h1 className={styles.companyTitle}>{companyName} Dashboard</h1>
            </div>

            <div className={styles.right}>
                <ThemeToggle />

                <button className={styles.iconBtn} aria-label="Notifications">
                    <Bell size={20} />
                    <span className={styles.badge} />
                </button>

                <div className={styles.divider} />

                <button className={styles.profileBtn} aria-label="User menu">
                    <div className={styles.avatar}>
                        <User size={18} />
                    </div>
                </button>
            </div>
        </header>
    );
};
