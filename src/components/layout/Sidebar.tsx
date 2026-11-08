import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Bell,
  LogOut,
  User,
  Users,
  Building2,
  Building,
  X,
  Compass,
  FileText,
  Calendar,
  Sparkles,
  Layers,
  Settings,
  Plus,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onPostJob?: () => void;
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
  onPostJob,
  onOpenNotifications,
}) => {
  const { user, logout, unreadNotifications } = useAuth();

  if (!user) return null;

  const isCandidate = user.role === 'candidate';

  // Navigation Items
  // Note: dashboard, applications, candidates are ordered first as requested by the user
  const hrNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layers,
      badge: 'Overview',
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      badge: 'Pipeline',
      badgeColor: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
      badge: 'Talent',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'manage-jobs',
      label: 'Manage Jobs',
      icon: Briefcase,
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: Calendar,
    },
    {
      id: 'company',
      label: 'My Company',
      icon: Building,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const candidateNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layers,
    },
    {
      id: 'applications',
      label: 'My Applications',
      icon: FileText,
    },
    {
      id: 'browse-jobs',
      label: 'Browse Jobs',
      icon: Compass,
    },
    {
      id: 'recommended-jobs',
      label: 'Recommended Jobs',
      icon: Sparkles,
      badge: 'AI Match',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'interviews',
      label: 'Interviews',
      icon: Calendar,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const navItems = isCandidate ? candidateNavItems : hrNavItems;

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80">
      {/* Top Header & Branding */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 transition-transform shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Hire Screen
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isCandidate
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      : 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                  }`}
                >
                  {isCandidate ? 'Candidate Portal' : 'HR Recruiter'}
                </span>
              </div>
            </div>
          </button>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Identity Card (for HR users) */}
        {!isCandidate && (
          <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {user.company?.logo ? (
                    <img
                      src={user.company.logo}
                      alt={user.company.company_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {user.company?.company_name || 'My Company'}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-mono font-medium text-violet-400 bg-violet-950/80 px-1.5 py-0.5 rounded border border-violet-800/60 truncate">
                      {user.company_id || 'ID Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Button for HR */}
        {!isCandidate && onPostJob && (
          <button
            onClick={() => {
              onPostJob();
              setMobileOpen(false);
            }}
            className="w-full mt-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        )}
      </div>

      {/* Navigation Links (Left Side Bar) */}
      <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/25 to-violet-600/20 text-white border border-indigo-500/40 shadow-xs shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/50'
                      : 'text-slate-400 group-hover:text-white group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom User Profile & Session Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate capitalize">
                {user.role === 'hr' ? (user.company?.company_name || 'HR Recruiter') : 'Candidate'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
                )}
              </button>
            )}

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Off-canvas sidebar */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
