import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Application, Interview, Company } from '../../types';
import { CandidateDetailModal } from './CandidateDetailModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { CompanyPublicDetailsModal } from './CompanyPublicDetailsModal';
import {
  Briefcase,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Plus,
  Eye,
  AlertCircle,
  Building2,
  Building,
  Layers,
  MapPin
} from 'lucide-react';

interface HrDashboardProps {
  onNavigate: (tab: string) => void;
  onPostJob: () => void;
  onViewJobApplications: (jobId: string) => void;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({
  onNavigate,
  onPostJob,
  onViewJobApplications,
}) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<{
    stats: {
      totalJobs: number;
      activeJobs: number;
      totalApplications: number;
      newApplications: number;
      shortlistedCandidates: number;
      upcomingInterviews: number;
      selectedCandidates: number;
      unreadNotifications: number;
    };
    statusBreakdown: { status: string; count: number }[];
    jobStats: { job_id: string; title: string; status: string; openings: number; applicant_count: number }[];
    upcomingInterviews: Interview[];
    recentApplications: Application[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [interviewApp, setInterviewApp] = useState<Application | null>(null);
  const [networkCompanies, setNetworkCompanies] = useState<Company[]>([]);
  const [publicCompanyModalId, setPublicCompanyModalId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, compRes] = await Promise.all([
        api.getHrDashboard(),
        api.getCompaniesList().catch(() => ({ companies: [] })),
      ]);
      setDashboardData(res);
      setNetworkCompanies(compRes?.companies || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load HR dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      fetchDashboard();
      if (selectedApp) setSelectedApp(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-900/60 border border-slate-800" />
          <div className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm">{error || 'Dashboard unavailable'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, statusBreakdown, jobStats, upcomingInterviews, recentApplications } = dashboardData;

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-violet-950 via-slate-900 to-slate-900 border border-violet-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            Recruiter Command Center · {user?.company?.company_name || 'Enterprise'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Manage your hiring pipeline, review incoming applicant credentials, and coordinate interviews in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => onNavigate('company')}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            title="Manage your company profile"
          >
            <Building className="w-3.5 h-3.5 text-indigo-400" />
            <span>My Company Profile</span>
          </button>
          <button
            onClick={() => onNavigate('manage-jobs')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Manage Jobs
          </button>
          <button
            onClick={onPostJob}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Opening</span>
          </button>
        </div>
      </div>

      {/* Active Corporate Workspace Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center overflow-hidden shrink-0">
            {user?.company?.logo ? (
              <img
                src={user.company.logo}
                alt={user.company.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-violet-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white">
                {user?.company?.company_name || 'Active Corporate Entity'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 border border-violet-700/60 text-violet-300">
                ID: {user?.company_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{user?.company?.industry || 'Enterprise Technology'}</span>
              {user?.company?.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {user.company.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Total Jobs</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.totalJobs}</span>
          <span className="text-[10px] text-slate-500">{stats.activeJobs} Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Active Jobs</span>
          <span className="text-2xl font-bold text-indigo-400 mt-1 block">{stats.activeJobs}</span>
          <span className="text-[10px] text-indigo-300">Live Postings</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Total Apps</span>
          <span className="text-2xl font-bold text-white mt-1 block">{stats.totalApplications}</span>
          <span className="text-[10px] text-slate-500">All Requisitions</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">New Apps</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{stats.newApplications}</span>
          <span className="text-[10px] text-amber-300">Pending Review</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Shortlisted</span>
          <span className="text-2xl font-bold text-cyan-400 mt-1 block">{stats.shortlistedCandidates}</span>
          <span className="text-[10px] text-cyan-300">Candidates</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Interviews</span>
          <span className="text-2xl font-bold text-violet-400 mt-1 block">{stats.upcomingInterviews}</span>
          <span className="text-[10px] text-violet-300">Scheduled</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 block">Selected</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{stats.selectedCandidates}</span>
          <span className="text-[10px] text-emerald-300">Offers Issued</span>
        </div>
      </div>

      {/* 3. Analytics Section: Pipeline Breakdown & Job Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applicant Pipeline Distribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Recruitment Pipeline Distribution
            </h2>
            <span className="text-xs text-slate-400">{stats.totalApplications} Total</span>
          </div>

          {stats.totalApplications === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No applicant data to visualize yet.
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Applied', color: 'bg-amber-400', textColor: 'text-amber-400' },
                { label: 'Under Review', color: 'bg-indigo-400', textColor: 'text-indigo-400' },
                { label: 'Shortlisted', color: 'bg-cyan-400', textColor: 'text-cyan-400' },
                { label: 'Interview Scheduled', color: 'bg-violet-400', textColor: 'text-violet-400' },
                { label: 'Selected', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
                { label: 'Not Selected', color: 'bg-red-400', textColor: 'text-red-400' },
              ].map((item) => {
                const found = statusBreakdown.find((s) => s.status === item.label);
                const count = found?.count || 0;
                const pct = stats.totalApplications > 0 ? Math.round((count / stats.totalApplications) * 100) : 0;

                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-semibold text-white">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Requisitions with Applicant Load */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Active Job Requisitions & Applicant Volume
            </h2>
            <button
              onClick={() => onNavigate('manage-jobs')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Requisitions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {jobStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No jobs posted yet. Post a requisition to begin receiving applications.
            </div>
          ) : (
            <div className="space-y-3">
              {jobStats.map((j) => (
                <div
                  key={j.job_id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-colors"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">{j.title}</h3>
                    <span className="text-[11px] text-slate-400">
                      Status: <strong className="text-slate-300">{j.status}</strong> · {j.openings} Openings
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {j.applicant_count} Applicants
                    </span>
                    <button
                      onClick={() => onViewJobApplications(j.job_id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Applications & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications table/list */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Recent Candidate Applications
            </h2>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No applications received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app.application_id}
                  onClick={() => setSelectedApp(app)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {app.candidate_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        {app.candidate_name}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {app.job_title} · Applied {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        app.status === 'Selected'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : app.status === 'Interview Scheduled'
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                          : app.status === 'Shortlisted'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : app.status === 'Not Selected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {app.status}
                    </span>
                    <Eye className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Interviews */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              Scheduled Interviews
            </h2>
            <button
              onClick={() => onNavigate('interviews')}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 cursor-pointer"
            >
              All
            </button>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No interviews scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((int) => (
                <div
                  key={int.interview_id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                      {int.candidate_name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300">
                      {int.interview_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{int.job_title}</div>
                  <div className="text-[11px] text-violet-300 flex items-center gap-1 pt-1 border-t border-slate-800/60">
                    <Clock className="w-3 h-3" />
                    <span>{int.interview_date} at {int.interview_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Candidate Profile Modal */}
      {selectedApp && (
        <CandidateDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onScheduleInterview={(app) => {
            setSelectedApp(null);
            setInterviewApp(app);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Interview Modal */}
      {interviewApp && (
        <ScheduleInterviewModal
          application={interviewApp}
          onClose={() => setInterviewApp(null)}
          onSuccess={fetchDashboard}
        />
      )}

      {/* Public Company Profile Modal */}
      {publicCompanyModalId && (
        <CompanyPublicDetailsModal
          companyId={publicCompanyModalId}
          onClose={() => setPublicCompanyModalId(null)}
          onSwitchToManage={() => {
            setPublicCompanyModalId(null);
            onNavigate('company');
          }}
        />
      )}
    </div>
  );
};
