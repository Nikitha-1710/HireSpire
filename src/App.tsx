import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BackgroundOrbs } from './components/layout/BackgroundOrbs';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { AuthPage } from './components/auth/AuthPage';

// Candidate Components
import { CandidateDashboard } from './components/candidate/CandidateDashboard';
import { CandidateProfile } from './components/candidate/CandidateProfile';
import { BrowseJobs } from './components/candidate/BrowseJobs';
import { MyApplications } from './components/candidate/MyApplications';
import { CandidateInterviews } from './components/candidate/CandidateInterviews';

// HR Components
import { HrDashboard } from './components/hr/HrDashboard';
import { CompanyProfile } from './components/hr/CompanyProfile';
import { ManageJobs } from './components/hr/ManageJobs';
import { ApplicationManagement } from './components/hr/ApplicationManagement';
import { CandidatesDirectory } from './components/hr/CandidatesDirectory';
import { HrInterviews } from './components/hr/HrInterviews';
import { PostJobModal } from './components/hr/PostJobModal';

// Common Components
import { NotificationsModal } from './components/common/NotificationsModal';
import { SettingsView } from './components/common/SettingsView';
import { Job, Application } from './types';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);

  // Cross-component navigation state
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [selectedApplicationForView, setSelectedApplicationForView] = useState<Application | null>(null);
  const [filterJobIdForApps, setFilterJobIdForApps] = useState<string | null>(null);
  const [postJobModalOpen, setPostJobModalOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wider uppercase text-slate-300">
          Loading HR Recruitment Management System...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
        <BackgroundOrbs />
        <AuthPage />
      </main>
    );
  }

  const isCandidate = user.role === 'candidate';

  // Handler when candidate clicks on a job from Recommended list in dashboard
  const handleSelectJob = (job: Job) => {
    setSelectedJobForModal(job);
    setCurrentTab('browse-jobs');
  };

  // Handler when candidate clicks on an application from Recent list in dashboard
  const handleSelectApplication = (app: Application) => {
    setSelectedApplicationForView(app);
    setCurrentTab('applications');
  };

  // Handler when HR clicks "View Applicants" for a specific job
  const handleViewJobApplications = (jobId: string) => {
    setFilterJobIdForApps(jobId);
    setCurrentTab('applications');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative selection:bg-indigo-500 selection:text-white">
      <BackgroundOrbs />

      {/* Left Navigation Sidebar (Dashboard, Applications, Candidates, etc.) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={sidebarMobileOpen}
        setMobileOpen={setSidebarMobileOpen}
        onPostJob={() => setPostJobModalOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Main Column (Offset by sidebar width on desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Sleek Top Header with current view breadcrumb, company badge, and notifications */}
        <TopHeader
          currentTab={currentTab}
          onOpenSidebar={() => setSidebarMobileOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onPostJob={() => setPostJobModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Candidate Role Views */}
          {isCandidate && (
            <>
              {currentTab === 'dashboard' && (
                <CandidateDashboard
                  onNavigate={setCurrentTab}
                  onSelectJob={handleSelectJob}
                  onSelectApplication={handleSelectApplication}
                />
              )}
              {currentTab === 'profile' && <CandidateProfile />}
              {currentTab === 'browse-jobs' && (
                <BrowseJobs
                  selectedJobId={selectedJobForModal?.job_id}
                  onClearSelectedJobId={() => setSelectedJobForModal(null)}
                />
              )}
              {currentTab === 'recommended-jobs' && <BrowseJobs recommendedOnly={true} />}
              {currentTab === 'applications' && (
                <MyApplications
                  initialSelectedApp={selectedApplicationForView}
                  onBrowseJobs={() => setCurrentTab('browse-jobs')}
                />
              )}
              {currentTab === 'interviews' && <CandidateInterviews />}
              {currentTab === 'settings' && <SettingsView />}
            </>
          )}

          {/* HR Recruiter Role Views */}
          {!isCandidate && (
            <>
              {currentTab === 'dashboard' && (
                <HrDashboard
                  onNavigate={setCurrentTab}
                  onPostJob={() => setPostJobModalOpen(true)}
                  onViewJobApplications={handleViewJobApplications}
                />
              )}
              {currentTab === 'company' && <CompanyProfile />}
              {currentTab === 'manage-jobs' && (
                <ManageJobs onViewJobApplications={handleViewJobApplications} />
              )}
              {currentTab === 'applications' && (
                <ApplicationManagement
                  initialJobId={filterJobIdForApps}
                  onClearInitialJobId={() => setFilterJobIdForApps(null)}
                />
              )}
              {currentTab === 'candidates' && <CandidatesDirectory />}
              {currentTab === 'interviews' && (
                <HrInterviews
                  onNavigate={setCurrentTab}
                  onPostJob={() => setPostJobModalOpen(true)}
                />
              )}
              {currentTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectApplicationById={() => {
          setCurrentTab('applications');
        }}
      />

      {/* Post Job Modal for HR */}
      {postJobModalOpen && (
        <PostJobModal
          onClose={() => setPostJobModalOpen(false)}
          onSuccess={() => {
            setPostJobModalOpen(false);
            setCurrentTab('manage-jobs');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
