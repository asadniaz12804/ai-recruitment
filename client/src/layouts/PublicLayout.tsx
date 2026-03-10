// src/layouts/PublicLayout.tsx
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import styles from './PublicLayout.module.css';

export function PublicLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/ai-recruitment', { replace: true });
    };

    return (
        <div className={styles.layout}>
            <header className={styles.navbar}>
                <div className={styles.navContainer}>
                    <div className={styles.navLeft}>
                        <Link to="/ai-recruitment" className={styles.logo}>
                            <div className={styles.logoIcon} />
                            <span className={styles.logoText}>AI Recruit</span>
                        </Link>

                        <nav className={styles.navLinks}>
                            <NavLink
                                to="/jobs"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                                }
                            >
                                Jobs
                            </NavLink>
                            {user?.role === 'candidate' && (
                                <>
                                    <NavLink
                                        to="/candidate/applications"
                                        className={({ isActive }) =>
                                            `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                                        }
                                    >
                                        Applications
                                    </NavLink>
                                    <NavLink
                                        to="/candidate/profile"
                                        className={({ isActive }) =>
                                            `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                                        }
                                    >
                                        Profile
                                    </NavLink>
                                </>
                            )}
                            {user && (user.role === 'recruiter' || user.role === 'admin') && (
                                <NavLink
                                    to={getHomePath(user)}
                                    className={({ isActive }) =>
                                        `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                                    }
                                >
                                    Dashboard
                                </NavLink>
                            )}
                        </nav>
                    </div>

                    <div className={styles.navRight}>
                        <ThemeToggle />

                        {user ? (
                            <>
                                <div className={styles.divider} />
                                <span className={styles.userName}>{user.name || user.email}</span>
                                <button
                                    className={styles.signOutBtn}
                                    onClick={handleLogout}
                                    title="Sign out"
                                >
                                    <LogOut size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className={styles.divider} />
                                <Link to="/login" className={styles.navBtnGhost}>
                                    Sign in
                                </Link>
                                <Link to="/register" className={styles.navBtnPrimary}>
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}
