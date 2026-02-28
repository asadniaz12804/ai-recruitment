// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantLayout } from '../layouts/TenantLayout';
import { LandingPage } from '../pages/LandingPage';
import { DashboardOverview } from '../pages/DashboardOverview';
import { JobsPage } from '../pages/JobsPage';
import { WorkflowPage } from '../pages/WorkflowPage';
import { CandidatesPage } from '../pages/CandidatesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PublicJobPage } from '../pages/PublicJobPage';

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Marketing Landing */}
                <Route path="/ai-recruitment" element={<LandingPage />} />

                {/* Public Root Redirect */}
                <Route path="/" element={<Navigate to="/ai-recruitment" replace />} />

                {/* Public Candidate Job Application View */}
                <Route path="/ai-recruitment/:companyName/jobs/:jobSlug" element={<PublicJobPage />} />

                {/* B2B SaaS Tenant Shell */}
                <Route path="/ai-recruitment/:companyName" element={<TenantLayout />}>
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
