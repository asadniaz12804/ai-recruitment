// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantLayout } from '../layouts/TenantLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardOverview } from '../pages/DashboardOverview';
import { JobsPage } from '../pages/JobsPage';
import { WorkflowPage } from '../pages/WorkflowPage';
import { CandidatesPage } from '../pages/CandidatesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { DemoDashboardPage } from '../pages/DemoDashboardPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PublicJobPage } from '../pages/PublicJobPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { CompanyCreatePage } from '../pages/CompanyCreatePage';
import { JobBoardPage } from '../pages/JobBoardPage';
import { JobDetailPage } from '../pages/JobDetailPage';
import { RecruiterApplicantsPage } from '../pages/RecruiterApplicantsPage';
import { RecruiterCandidateDetailPage } from '../pages/RecruiterCandidateDetailPage';
import { RequireAuth } from '../components/shared/RequireAuth';

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Marketing Landing (own layout) */}
                <Route path="/ai-recruitment" element={<LandingPage />} />

                {/* Demo Dashboard (standalone) */}
                <Route path="/demo" element={<DemoDashboardPage />} />

                {/* Root Redirect */}
                <Route path="/" element={<Navigate to="/ai-recruitment" replace />} />

                {/* Auth Pages (standalone, no shared layout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* ===== Public Layout shell (shared nav) ===== */}
                <Route element={<PublicLayout />}>
                    {/* Public Job Board */}
                    <Route path="/jobs" element={<JobBoardPage />} />
                    <Route path="/jobs/:id" element={<JobDetailPage />} />

                    {/* Removed Candidate-only pages */}

                    {/* Recruiter: applicants list */}
                    <Route path="/recruiter/jobs/:jobId/applicants" element={
                        <RequireAuth roles={['recruiter', 'admin']}>
                            <RecruiterApplicantsPage />
                        </RequireAuth>
                    } />
                </Route>

                {/* Public Candidate Job Application View — uses company slug */}
                <Route path="/ai-recruitment/:companySlug/jobs/:jobSlug" element={<PublicJobPage />} />

                {/* Admin-only */}
                <Route path="/admin/users" element={
                    <RequireAuth roles={['admin']}>
                        <AdminUsersPage />
                    </RequireAuth>
                } />

                {/* Company creation — recruiter onboarding */}
                <Route path="/company/new" element={
                    <RequireAuth roles={['admin', 'recruiter']}>
                        <CompanyCreatePage />
                    </RequireAuth>
                } />

                {/* B2B SaaS Tenant Shell — uses company slug */}
                <Route path="/ai-recruitment/:companySlug" element={
                    <RequireAuth>
                        <TenantLayout />
                    </RequireAuth>
                }>
                    <Route index element={<DashboardOverview />} />
                    <Route path="jobs" element={<JobsPage />} />
                    <Route path="workflow" element={<WorkflowPage />} />
                    <Route path="candidates" element={<CandidatesPage />} />
                    <Route path="candidates/:candidateId" element={<RecruiterCandidateDetailPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};
