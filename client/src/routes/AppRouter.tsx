// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantLayout } from '../layouts/TenantLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardOverview } from '../pages/DashboardOverview';
import { JobsPage } from '../pages/JobsPage';
import { WorkflowPage } from '../pages/WorkflowPage';
import { CandidatesPage } from '../pages/CandidatesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PublicJobPage } from '../pages/PublicJobPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { CompanyCreatePage } from '../pages/CompanyCreatePage';
import { RequireAuth } from '../components/shared/RequireAuth';

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Marketing Landing */}
                <Route path="/ai-recruitment" element={<LandingPage />} />

                {/* Public Root Redirect */}
                <Route path="/" element={<Navigate to="/ai-recruitment" replace />} />

                {/* Auth Pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Public Candidate Job Application View */}
                <Route path="/ai-recruitment/:companyName/jobs/:jobSlug" element={<PublicJobPage />} />

                {/* Admin-only routes */}
                <Route path="/admin/users" element={
                    <RequireAuth roles={['admin']}>
                        <AdminUsersPage />
                    </RequireAuth>
                } />

                {/* Company creation: admin or recruiter */}
                <Route path="/company/new" element={
                    <RequireAuth roles={['admin', 'recruiter']}>
                        <CompanyCreatePage />
                    </RequireAuth>
                } />

                {/* B2B SaaS Tenant Shell (protected) */}
                <Route path="/ai-recruitment/:companyName" element={
                    <RequireAuth>
                        <TenantLayout />
                    </RequireAuth>
                }>
                    <Route index element={<DashboardOverview />} />
                    <Route path="jobs" element={<JobsPage />} />
                    <Route path="workflow" element={<WorkflowPage />} />
                    <Route path="candidates" element={<CandidatesPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};
