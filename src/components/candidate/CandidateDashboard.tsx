import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Job, Application, Interview } from '../../types';
import { formatExternalUrl } from '../../utils/url';
import {
  Sparkles,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building2,
  DollarSign,
  AlertCircle,
  Briefcase,
  ChevronRight,
  UserCheck,
  Globe,
  ExternalLink
} from 'lucide-react';

interface CandidateDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectJob: (job: Job) => void;
  onSelectApplication: (app: Application) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  onNavigate,
  onSelectJob,
  onSelectApplication,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    candidateName: string;
    profileCompletion: number;
    stats: {
      totalApplications: number;
      shortlisted: number;
      upcomingInterviews: number;
      selected: number;
      unreadNotifications: number;
    };
    upcomingInterviews: Interview[];
    recentApplications: Application[];
    recommendedJobs: Job[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getCandidateDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

  if (error || !data) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Could not load candidate dashboard</h3>
        <p className="text-sm text-slate-400 mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Hero Banner with Profile Completion */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              Candidate Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {data.candidateName}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track your applications, review transparent job match scores, and prepare for upcoming interviews.
            </p>

            {/* Quick Profile External Links */}
            {(user?.profile?.github_url || user?.profile?.linkedin_url) && (
              <div className="flex flex-wrap items-center gap-2 mt-3.5">
                {user.profile.github_url && (
                  <a
                    href={formatExternalUrl(user.profile.github_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>My GitHub Profile</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                )}
                {user.profile.linkedin_url && (
                  <a
                    href={formatExternalUrl(user.profile.linkedin_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-blue-200 hover:text-white transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>My LinkedIn Profile</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Profile Completion Bar */}
          <div className="w-full md:w-72 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Profile Completion</span>
              <span className="text-xs font-bold text-indigo-400">{data.profileCompletion}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${data.profileCompletion}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {data.profileCompletion === 100 ? 'All details up to date!' : 'Upload resume & details'}
              </span>
              <button
                onClick={() => onNavigate('profile')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Profile</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Applications</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{data.stats.totalApplications}</span>
            <span className="text-xs text-slate-400">submitted</span>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Shortlisted</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">{data.stats.shortlisted}</span>
            <span className="text-xs text-slate-400">in review</span>
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Interviews</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-violet-400">{data.stats.upcomingInterviews}</span>
            <span className="text-xs text-slate-400">scheduled</span>
          </div>
        </div>

        {/* Selected */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Selected / Offers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{data.stats.selected}</span>
            <span className="text-xs text-slate-400">offers extended</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Content: Recommended Jobs & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Top Recommended Jobs (Transparent matching) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Recommended Jobs For You
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by our transparent skill, experience, education, and location matching algorithm
              </p>
            </div>
            <button
              onClick={() => onNavigate('browse-jobs')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(!data.recommendedJobs || data.recommendedJobs.length === 0) ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-900/30 border border-indigo-700/40 flex items-center justify-center text-indigo-400 mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">No active job postings yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Jobs posted by registered HR recruiters will appear here automatically for you to explore and apply.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.recommendedJobs.map((job) => {
                const match = job.match_score ?? 70;
                const compName = job.company_name || 'Hiring Organization';
                return (
                  <div
                    key={job.job_id}
                    onClick={() => onSelectJob(job)}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Top Row: Company & Match Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          {job.company_logo ? (
                            <img
                              src={job.company_logo}
                              alt={compName}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-800"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-900/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                              {compName.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-medium text-slate-300 truncate max-w-[130px]">
                            {compName}
                          </span>
                        </div>

                        {/* Transparent Match Score Badge */}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            match >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : match >= 60
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {match}% Match
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {job.title}
                      </h3>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {job.location}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-slate-500" />
                          {job.salary_range}
                        </span>
                      </div>

                      {/* Matching Factors snippet */}
                      {job.match_reasons && job.match_reasons.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{job.match_reasons[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {job.already_applied ? 'Applied' : 'View & Apply'}
                      </span>
                      <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Interviews & Recent Applications */}
        <div className="space-y-6">
          {/* Upcoming Interviews widget */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                Upcoming Interviews
              </h3>
              <button
                onClick={() => onNavigate('interviews')}
                className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            {data.upcomingInterviews.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No interviews scheduled currently. Shortlisted applications will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingInterviews.map((int) => (
                  <div
                    key={int.interview_id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-violet-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                        {int.job_title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {int.interview_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{int.company_name}</div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1 text-violet-300">
                        <Clock className="w-3 h-3" />
                        {int.interview_date} at {int.interview_time}
                      </span>
                      <span className="text-slate-400 truncate max-w-[90px]">{int.interviewer}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications List */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Recent Applications
              </h3>
              <button
                onClick={() => onNavigate('applications')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Track All
              </button>
            </div>

            {data.recentApplications.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                You haven't applied to any jobs yet. Check out Recommended Jobs above!
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentApplications.map((app) => (
                  <div
                    key={app.application_id}
                    onClick={() => onSelectApplication(app)}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{app.job_title}</div>
                      <div className="text-[11px] text-slate-400">{app.company_name}</div>
                    </div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
