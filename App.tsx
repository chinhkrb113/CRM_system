
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { I18nProvider } from './contexts/I18nProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastProvider';

import AppShell from './components/layout/AppShell';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import LeadsPage from './features/acquisition/LeadsPage';
import StudentProfilePage from './features/learning/StudentProfilePage';
import StudentListPage from './features/learning/StudentListPage';
import TeamsPage from './features/learning/TeamsPage';
import JobsPage from './features/enterprise/JobsPage';
import JobMatchesPage from './features/enterprise/JobMatchesPage';
import OpsDashboardPage from './features/ops/OpsDashboardPage';
import SettingsPage from './features/ops/SettingsPage';
import StudentSettingsPage from './features/learning/StudentSettingsPage';
import MyTeamsPage from './features/learning/MyTeamsPage';
import TeamDetailPage from './features/learning/TeamDetailPage';
import MentorSettingsPage from './features/learning/MentorSettingsPage';
import EditLeadPage from './features/acquisition/EditLeadPage';
import EditStudentPage from './features/learning/EditStudentPage';
import EditTeamPage from './features/learning/EditTeamPage';
import EditTaskPage from './features/learning/EditTaskPage';
import ClaimLeadsPage from './features/acquisition/ClaimLeadsPage';
import AllJobsPage from './features/enterprise/AllJobsPage';

import { MyApplicationsPage } from './features/enterprise/MyApplicationsPage';
import { JobApplicationsPage } from './features/learning/JobApplicationsPage';
import { JobApplicationsManagementPage } from './features/enterprise/JobApplicationsManagementPage';
import EditProfilePage from './features/profile/EditProfilePage';
import CompaniesPage from './features/admin/CompaniesPage';
import AgentsPage from './features/admin/AgentsPage';
import StudentDirectoryPage from './features/enterprise/StudentDirectoryPage';
import InterviewManagementPage from './features/enterprise/InterviewManagementPage';
import InterviewDetailPage from './features/enterprise/InterviewDetailPage';
import InterviewListPage from './features/enterprise/InterviewListPage';
import DailyInterviewsPage from './features/enterprise/DailyInterviewsPage';
import InterviewCompletionPage from './features/enterprise/InterviewCompletionPage';
import EditCompanyPage from './features/admin/EditCompanyPage';
import EditAgentPage from './features/admin/EditAgentPage';
import EditJobPage from './features/enterprise/EditJobPage';
import EditUserPage from './features/ops/EditUserPage';
import StudentInterviewsPage from './features/learning/StudentInterviewsPage';
import SchoolsPage from './features/admin/SchoolsPage';
import EditSchoolPage from './features/admin/EditSchoolPage';
import SchoolSettingsPage from './features/learning/SchoolSettingsPage';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}


function App(): React.ReactNode {
  return (
    <ThemeProvider defaultTheme="light" storageKey="synergy-crm-theme">
      <I18nProvider>
        <ToastProvider>
          <HashRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                 <Route 
                  path="/enterprise/interviews/:interviewId/complete"
                  element={
                    <ProtectedRoute>
                      <InterviewCompletionPage />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Routes>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/acquisition/leads" element={<LeadsPage />} />
                          <Route path="/acquisition/leads/new" element={<EditLeadPage />} />
                          <Route path="/acquisition/claim-leads" element={<ClaimLeadsPage />} />
                          <Route path="/acquisition/leads/:leadId/view" element={<EditLeadPage />} />
                          <Route path="/acquisition/leads/:leadId/edit" element={<EditLeadPage />} />
                          <Route path="/learning/students" element={<StudentListPage />} />
                          <Route path="/learning/students/new" element={<EditStudentPage />} />
                          <Route path="/learning/students/:studentId" element={<StudentProfilePage />} />
                          <Route path="/learning/students/:studentId/view" element={<EditStudentPage />} />
                          <Route path="/learning/students/:studentId/edit" element={<EditStudentPage />} />
                          <Route path="/learning/settings" element={<StudentSettingsPage />} />
                          <Route path="/learning/mentor-settings" element={<MentorSettingsPage />} />
                          <Route path="/learning/teams" element={<TeamsPage />} />
                          <Route path="/learning/teams/new" element={<EditTeamPage />} />
                          <Route path="/learning/my-teams" element={<MyTeamsPage />} />
                          <Route path="/learning/teams/:teamId" element={<TeamDetailPage />} />
                          <Route path="/learning/teams/:teamId/edit" element={<EditTeamPage />} />
                          <Route path="/learning/teams/:teamId/tasks/:taskId/edit" element={<EditTaskPage />} />
                          <Route path="/enterprise/jobs" element={<JobsPage />} />
                          <Route path="/enterprise/jobs/new" element={<EditJobPage />} />
                          <Route path="/enterprise/jobs/:jobId/edit" element={<EditJobPage />} />
                          <Route path="/enterprise/jobs/:jobId/view" element={<EditJobPage />} />
                          <Route path="/enterprise/interviews" element={<InterviewManagementPage />} />
                          <Route path="/enterprise/interviews/day/:dateString" element={<DailyInterviewsPage />} />
                          <Route path="/enterprise/interview-list" element={<InterviewListPage />} />
                          <Route path="/enterprise/interviews/:interviewId" element={<InterviewDetailPage />} />
                          <Route path="/enterprise/student-directory" element={<StudentDirectoryPage />} />
                          <Route path="/enterprise/applications-management" element={<JobApplicationsManagementPage />} />
                          <Route path="/enterprise/all-jobs" element={<AllJobsPage />} />
                          <Route path="/enterprise/my-applications" element={<MyApplicationsPage />} />
                          <Route path="/enterprise/jobs/:jobId/matches" element={<JobMatchesPage />} />
                          <Route path="/learning/job-applications" element={<JobApplicationsPage />} />
                          <Route path="/learning/my-interviews" element={<StudentInterviewsPage />} />
                          <Route path="/ops/dashboard" element={<OpsDashboardPage />} />
                          <Route path="/ops/settings" element={<SettingsPage />} />
                          <Route path="/ops/users/new" element={<EditUserPage />} />
                          <Route path="/ops/users/:userId/edit" element={<EditUserPage />} />
                          <Route path="/ops/users/:userId/view" element={<EditUserPage />} />
                          <Route path="/profile/settings" element={<EditProfilePage />} />
                          <Route path="/school/settings" element={<SchoolSettingsPage />} />
                          <Route path="/admin/companies" element={<CompaniesPage />} />
                          <Route path="/admin/companies/new" element={<EditCompanyPage />} />
                          <Route path="/admin/companies/:companyId/edit" element={<EditCompanyPage />} />
                          <Route path="/admin/companies/:companyId/view" element={<EditCompanyPage />} />
                          <Route path="/admin/agents" element={<AgentsPage />} />
                          <Route path="/admin/agents/new" element={<EditAgentPage />} />
                          <Route path="/admin/agents/:agentId/edit" element={<EditAgentPage />} />
                          <Route path="/admin/agents/:agentId/view" element={<EditAgentPage />} />
                          <Route path="/admin/schools" element={<SchoolsPage />} />
                          <Route path="/admin/schools/new" element={<EditSchoolPage />} />
                          <Route path="/admin/schools/:schoolId/edit" element={<EditSchoolPage />} />
                          <Route path="/admin/schools/:schoolId/view" element={<EditSchoolPage />} />
                        </Routes>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </HashRouter>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
