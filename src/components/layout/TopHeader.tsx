import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  Plus,
  Layers,
  FileText,
  Users,
  Briefcase,
  Calendar,
  Building,
  Settings,
  Compass,
  Sparkles,
  User,
} from 'lucide-react';

interface TopHeaderProps {
  currentTab: string;
  onOpenSidebar: () => void;
  onOpenNotifications: () => void;
  onPostJob?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onOpenSidebar,
  onOpenNotifications,
  onPostJob,
}) => {
  const { user, unreadNotifications } = useAuth();

  if (!user) return null;

  const isCandidate = user.role === 'candidate';

  // Tab metadata for top header title & breadcrumbs
  const tabTitles: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
    dashboard: {
      label: 'Dashboard',
      icon: Layers,
      description: isCandidate ? 'Overview of your job search and applications' : 'Recruitment pipeline, recent applicants & company overview',
    },
    applications: {
      label: isCandidate ? 'My Applications' : 'Applications Pipeline',
      icon: FileText,
      description: isCandidate ? 'Track the status of your submitted job applications' : 'Review candidates, screen resumes, and move stages',
    },
    candidates: {
      label: 'Candidates Directory',
      icon: Users,
      description: 'Search and inspect candidate profiles, skills, and experience',
    },
    'manage-jobs': {
      label: 'Manage Job Postings',
      icon: Briefcase,
      description: 'Create, update, and monitor company job listings',
    },
    interviews: {
      label: 'Interviews & Schedules',
      icon: Calendar,
      description: 'Track upcoming interviews and video meeting details',
    },
    company: {
      label: 'My Company Profile',
      icon: Building,
      description: 'Manage corporate information, logo, website, and public visibility',
    },
    'browse-jobs': {
      label: 'Browse Jobs',
      icon: Compass,
      description: 'Explore active job vacancies and opportunities',
    },
    'recommended-jobs': {
      label: 'Recommended Jobs',
      icon: Sparkles,
      description: 'Job postings tailored to your skills and qualifications',
    },
    profile: {
      label: 'Candidate Profile',
      icon: User,
      description: 'Manage your resume, skills, education, and career history',
    },
    settings: {
      label: 'Settings',
      icon: Settings,
      description: 'System configurations and account preferences',
    },
  };

  const currentMeta = tabTitles[currentTab] || {
    label: 'Dashboard',
    icon: Layers,
    description: 'Welcome to Hire Screen',
  };

  const Icon = currentMeta.icon;

  return (
    <header className="sticky top-0 z-20 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger to open Left Sidebar */}
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Open Left Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Active Section Info */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 items-center justify-center text-indigo-400">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 leading-none">
                  <span>{currentMeta.label}</span>
                </h1>
                <p className="hidden md:block text-[11px] text-slate-400 mt-0.5 max-w-md truncate">
                  {currentMeta.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions, Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Post Job CTA (for HR on larger screens) */}
            {!isCandidate && onPostJob && (
              <button
                onClick={onPostJob}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs shadow-violet-600/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Job</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-200 block leading-tight max-w-[100px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user.role === 'hr' ? 'HR Recruiter' : 'Candidate'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
