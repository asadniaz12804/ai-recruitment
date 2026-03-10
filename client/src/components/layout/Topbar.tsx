// src/components/layout/Topbar.tsx
import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../shared/ThemeToggle';
import styles from './Topbar.module.css';

interface TopbarProps {
    companyName: string;
    onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ companyName, onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/ai-recruitment', { replace: true });
    };

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

                <div className={styles.profileBtn} aria-label="User info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={styles.avatar}>
                        <User size={18} />
                    </div>
                    {user && <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{user.name || user.email}</span>}
                </div>

                <button
                    className={styles.iconBtn}
                    onClick={handleLogout}
                    aria-label="Sign out"
                    title="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};
