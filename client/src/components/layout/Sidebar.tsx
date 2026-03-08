// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    GitMerge,
    Users,
    BarChart3,
    Settings,
    X
} from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';

interface SidebarProps {
    companyName: string;
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ companyName, isOpen, onClose }) => {
    const getNavPath = (path: string) => `/ai-recruitment/${companyName}/${path}`;

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '' },
        { label: 'Jobs', icon: Briefcase, path: 'jobs' },
        { label: 'Workflow', icon: GitMerge, path: 'workflow' },
        { label: 'Candidates', icon: Users, path: 'candidates' },
        { label: 'Analytics', icon: BarChart3, path: 'analytics' },
    ];

    return (
        <aside className={clsx(styles.sidebar, isOpen && styles.open)}>
            <div className={styles.header}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon} />
                    <span className={styles.logoText}>AI Recruit</span>
                </div>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">
                    <X size={20} />
                </button>
            </div>

            <div className={styles.companyBadge}>
                <div className={styles.companyAvatar}>
                    {companyName.charAt(0).toUpperCase()}
                </div>
                <span className={styles.companyNameText}>{companyName}</span>
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map((item) => (
                        <li key={item.path} className={styles.navItem}>
                            <NavLink
                                to={getNavPath(item.path)}
                                end={item.path === ''}
                                className={({ isActive }) =>
                                    clsx(styles.navLink, isActive && styles.active)
                                }
                                onClick={() => onClose()} // Close on mobile navigation
                            >
                                <item.icon className={styles.navIcon} size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className={styles.spacer} />

                <ul className={styles.navList}>
                    <li className={styles.navItem}>
                        <NavLink
                            to={getNavPath('settings')}
                            className={({ isActive }) =>
                                clsx(styles.navLink, isActive && styles.active)
                            }
                            onClick={() => onClose()}
                        >
                            <Settings className={styles.navIcon} size={20} />
                            <span>Settings</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};
