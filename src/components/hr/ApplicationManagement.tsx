import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Application, Job } from '../../types';
import { formatExternalUrl } from '../../utils/url';
import { CandidateDetailModal } from './CandidateDetailModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import {
  FileText,
  Search,
  Filter,
  User,
  GraduationCap,
  Briefcase,
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid,
  ExternalLink,
  Globe,
  Info,
  Check,
  ShieldCheck
} from 'lucide-react';

interface ApplicationManagementProps {
  initialJobId?: string | null;
  onClearInitialJobId?: () => void;
}

export const ApplicationManagement: React.FC<ApplicationManagementProps> = ({
  initialJobId,
  onClearInitialJobId,
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'All');
  const [minFitScore, setMinFitScore] = useState<string>('0');
  const [sortBy, setSortBy] = useState<string>('fit_score_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobList, setJobList] = useState<Job[]>([]);

  // View mode: 'table' (HR Ranked View) or 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Expanded explanations in table view
  const [expandedRowAppId, setExpandedRowAppId] = useState<string | null>(null);

  // Modals
  const [selectedCandidateApp, setSelectedCandidateApp] = useState<Application | null>(null);
  const [interviewModalApp, setInterviewModalApp] = useState<Application | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (selectedStatus && selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedJobId && selectedJobId !== 'All') params.job_id = selectedJobId;
      if (minFitScore && minFitScore !== '0') params.min_fit_score = minFitScore;
      if (sortBy) params.sort_by = sortBy;

      const [appsRes, jobsRes] = await Promise.all([
        api.getHrApplications(params),
        api.getHrJobs(),
      ]);

      setApplications(appsRes.applications);
      setJobList(jobsRes.jobs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, selectedJobId, minFitScore, sortBy]);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.application_id === appId ? { ...a, status: newStatus as any } : a))
      );
      if (selectedCandidateApp && selectedCandidateApp.application_id === appId) {
        setSelectedCandidateApp({ ...selectedCandidateApp, status: newStatus as any });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update application status');
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidate_name?.toLowerCase().includes(q) ||
      app.job_title?.toLowerCase().includes(q) ||
      app.candidate_skills?.toLowerCase().includes(q) ||
      app.candidate_location?.toLowerCase().includes(q)
    );
  });

  const getFitBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 70) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (score >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Selected':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Interview Scheduled':
        return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
      case 'Shortlisted':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Under Review':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Not Selected':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Candidate Fit Score & Application Ranking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Applicants are automatically evaluated and ranked by objective Fit Score matching skills, experience, education, and location. Candidate Fit Score is kept strictly separate from pipeline status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Ranked Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards View</span>
            </button>
          </div>

          <button
            onClick={fetchApplications}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Compliance / Neutrality Banner */}
      <div className="flex items-start sm:items-center gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-indigo-500/20 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-relaxed">
          <strong className="text-white">Objective Fit Scoring:</strong> Fit score calculation is purely algorithmic based on configured job requirements and candidate profile data (skills, experience, education, location). HR users cannot manually edit fit scores, ensuring bias-free ranking.
        </span>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, skill..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Job Filter */}
          <div>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                if (onClearInitialJobId) onClearInitialJobId();
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="All">All Job Postings</option>
              {jobList.map((j) => (
                <option key={j.job_id} value={j.job_id}>
                  {j.title} ({j.openings} Openings)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="All">All Pipeline Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="Not Selected">Not Selected</option>
            </select>
          </div>

          {/* Minimum Fit Score Filter */}
          <div>
            <select
              value={minFitScore}
              onChange={(e) => setMinFitScore(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="0">Min Fit Score: Any (0%+)</option>
              <option value="50">Min Fit Score: 50%+</option>
              <option value="60">Min Fit Score: 60%+</option>
              <option value="70">Min Fit Score: 70%+ (Strong)</option>
              <option value="80">Min Fit Score: 80%+ (High)</option>
              <option value="90">Min Fit Score: 90%+ (Top Match)</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="fit_score_desc">Fit Score: High → Low (Default)</option>
              <option value="fit_score_asc">Fit Score: Low → High</option>
              <option value="applied_at_desc">Applied Date: Newest First</option>
              <option value="name_asc">Candidate Name: A → Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-red-400 text-sm">
          {error}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No candidates match your filter criteria.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try lowering the Minimum Fit Score threshold or selecting "All Pipeline Statuses".
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ======================================================== */
        /* HR RANKED TABLE VIEW (Exact prompt table format)       */
        /* Rank | Candidate | Fit Score | Experience | Skills Match | Status | Actions */
        /* ======================================================== */
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4 min-w-[200px]">Candidate</th>
                <th className="py-3.5 px-4 min-w-[140px]">Fit Score</th>
                <th className="py-3.5 px-4 min-w-[110px]">Experience</th>
                <th className="py-3.5 px-4 min-w-[110px]">Skills Match</th>
                <th className="py-3.5 px-4 min-w-[150px]">Status</th>
                <th className="py-3.5 px-4 text-right min-w-[170px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredApps.map((app, idx) => {
                const fit = app.fit_score ?? app.match_score ?? 0;
                const isExpanded = expandedRowAppId === app.application_id;

                return (
                  <React.Fragment key={app.application_id}>
                    <tr className="hover:bg-slate-800/30 transition-colors group">
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold text-xs ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-200/20 text-slate-200 border border-slate-400/30'
                              : idx === 2
                              ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {app.rank ?? idx + 1}
                        </span>
                      </td>

                      {/* Candidate Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 font-bold shrink-0 overflow-hidden">
                            {app.candidate_photo ? (
                              <img
                                src={app.candidate_photo}
                                alt={app.candidate_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              app.candidate_name?.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setSelectedCandidateApp(app)}
                              className="font-bold text-white hover:text-indigo-400 transition-colors text-sm truncate block text-left cursor-pointer"
                            >
                              {app.candidate_name}
                            </button>
                            <span className="text-[11px] text-slate-400 truncate block">
                              For <strong className="text-slate-300">{app.job_title}</strong>
                            </span>

                            {/* Candidate Links: Resume, GitHub, LinkedIn */}
                            <div className="flex items-center gap-2 mt-1">
                              {app.resume_url && (
                                <a
                                  href={app.resume_url}
                                  download={app.resume_name || 'Resume.txt'}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 hover:underline"
                                  title="Download Resume"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>Resume</span>
                                </a>
                              )}
                              {app.candidate_github && (
                                <a
                                  href={formatExternalUrl(app.candidate_github)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-slate-300 hover:text-white flex items-center gap-0.5 hover:underline"
                                  title="GitHub Profile"
                                >
                                  <Globe className="w-2.5 h-2.5 text-indigo-400" />
                                  <span>GitHub</span>
                                </a>
                              )}
                              {app.candidate_linkedin && (
                                <a
                                  href={formatExternalUrl(app.candidate_linkedin)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline"
                                  title="LinkedIn Profile"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>LinkedIn</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fit Score Column */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${getFitBadgeColor(
                                fit
                              )}`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {fit}% Fit
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-28 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                fit >= 85
                                  ? 'bg-emerald-500'
                                  : fit >= 70
                                  ? 'bg-indigo-500'
                                  : fit >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, fit))}%` }}
                            />
                          </div>

                          {/* Explanation Toggle */}
                          <button
                            onClick={() =>
                              setExpandedRowAppId(isExpanded ? null : app.application_id)
                            }
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Why {fit}%?</span>
                            {isExpanded ? (
                              <ChevronUp className="w-2.5 h-2.5" />
                            ) : (
                              <ChevronDown className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Experience Column */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border inline-block ${
                            app.experience_status === 'Matched' || app.experience_status === 'Exceeds'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : app.experience_status === 'Partial'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {app.experience_status || 'Matched'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                          {app.candidate_experience || 'N/A'}
                        </span>
                      </td>

                      {/* Skills Match Column */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200 text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-indigo-400" />
                          {app.skills_match_ratio ||
                            `${app.skills_matched_count ?? 4}/${app.skills_total_count ?? 5}`}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          Skills match
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.application_id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer outline-none transition-colors ${getStatusBadgeColor(
                            app.status
                          )}`}
                        >
                          <option value="Applied" className="bg-slate-900 text-slate-200">
                            Applied
                          </option>
                          <option value="Under Review" className="bg-slate-900 text-slate-200">
                            Under Review
                          </option>
                          <option value="Shortlisted" className="bg-slate-900 text-cyan-300">
                            Shortlisted
                          </option>
                          <option
                            value="Interview Scheduled"
                            className="bg-slate-900 text-violet-300"
                          >
                            Interview Scheduled
                          </option>
                          <option value="Selected" className="bg-slate-900 text-emerald-300">
                            Selected
                          </option>
                          <option value="Not Selected" className="bg-slate-900 text-red-300">
                            Not Selected
                          </option>
                        </select>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCandidateApp(app)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="View Full Candidate Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setInterviewModalApp(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-[11px] shadow-xs cursor-pointer transition-colors"
                            title="Schedule Interview"
                          >
                            <Calendar className="w-3 h-3" />
                            <span className="hidden sm:inline">Schedule</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Explanatory Row for Score Factors */}
                    {isExpanded && (
                      <tr className="bg-slate-950/70 border-b border-slate-800">
                        <td colSpan={7} className="p-4 pl-14">
                          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              Candidate Fit Score Explanation ({fit}% match for {app.job_title}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {app.match_reasons && app.match_reasons.length > 0 ? (
                                app.match_reasons.map((r, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>{r}</span>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Technical skill requirements matched</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Experience requirements verified</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Education & location criteria matched</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ======================================================== */
        /* DETAILED CARDS VIEW                                      */
        /* ======================================================== */
        <div className="space-y-3.5">
          {filteredApps.map((app, idx) => {
            const fit = app.fit_score ?? app.match_score ?? 0;
            let skills: string[] = [];
            try {
              const p = JSON.parse(app.candidate_skills || '[]');
              if (Array.isArray(p)) skills = p;
              else skills = (app.candidate_skills || '').split(',').map((s) => s.trim());
            } catch {
              skills = (app.candidate_skills || '').split(',').map((s) => s.trim());
            }

            return (
              <div
                key={app.application_id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4 shadow-sm"
              >
                {/* Header Row: Rank, Candidate Name, Job, Fit Score & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-200/20 text-slate-200 border border-slate-400/30'
                          : idx === 2
                          ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}
                    >
                      #{app.rank ?? idx + 1}
                    </span>

                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0 overflow-hidden">
                      {app.candidate_photo ? (
                        <img
                          src={app.candidate_photo}
                          alt={app.candidate_name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        app.candidate_name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCandidateApp(app)}
                          className="text-base font-bold text-white hover:text-indigo-400 transition-colors leading-tight text-left cursor-pointer"
                        >
                          {app.candidate_name}
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFitBadgeColor(
                            fit
                          )}`}
                        >
                          {fit}% Fit
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Applied for <strong className="text-slate-200">{app.job_title}</strong> ·{' '}
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge & Control */}
                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStatus(app.application_id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer outline-none transition-colors ${getStatusBadgeColor(
                        app.status
                      )}`}
                    >
                      <option value="Applied" className="bg-slate-900 text-slate-200">
                        Applied
                      </option>
                      <option value="Under Review" className="bg-slate-900 text-slate-200">
                        Under Review
                      </option>
                      <option value="Shortlisted" className="bg-slate-900 text-cyan-300">
                        Shortlisted
                      </option>
                      <option value="Interview Scheduled" className="bg-slate-900 text-violet-300">
                        Interview Scheduled
                      </option>
                      <option value="Selected" className="bg-slate-900 text-emerald-300">
                        Selected
                      </option>
                      <option value="Not Selected" className="bg-slate-900 text-red-300">
                        Not Selected
                      </option>
                    </select>
                  </div>
                </div>

                {/* Candidate Credentials Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">
                      Education
                    </span>
                    <span className="text-slate-200 truncate block">
                      {app.candidate_education || 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">
                      Experience
                    </span>
                    <span className="text-slate-200 truncate block">
                      {app.candidate_experience || 'N/A'} ({app.experience_status || 'Matched'})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">
                      Skills Match
                    </span>
                    <span className="text-slate-200 truncate block">
                      {app.skills_match_ratio ||
                        `${app.skills_matched_count ?? 4}/${app.skills_total_count ?? 5}`}{' '}
                      Required Skills
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-0.5">
                        Resume Document
                      </span>
                      <span className="text-slate-200 truncate block max-w-[100px]">
                        {app.resume_name || 'Resume.txt'}
                      </span>
                    </div>
                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        download={app.resume_name || 'resume.txt'}
                        className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300"
                        title="Download Resume"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Score Reasons Badges */}
                {app.match_reasons && app.match_reasons.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {app.match_reasons.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skills tags */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 8).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCandidateApp(app)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Candidate Profile</span>
                    </button>

                    {app.candidate_github && (
                      <a
                        href={formatExternalUrl(app.candidate_github)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                        title="Open Candidate's GitHub Profile"
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span>GitHub</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    )}

                    {app.candidate_linkedin && (
                      <a
                        href={formatExternalUrl(app.candidate_linkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-300 hover:text-white flex items-center gap-1 hover:underline"
                        title="Open Candidate's LinkedIn Profile"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>LinkedIn</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setInterviewModalApp(app)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule Interview</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Modal */}
      {selectedCandidateApp && (
        <CandidateDetailModal
          application={selectedCandidateApp}
          onClose={() => setSelectedCandidateApp(null)}
          onScheduleInterview={(app) => {
            setSelectedCandidateApp(null);
            setInterviewModalApp(app);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Interview Scheduling Modal */}
      {interviewModalApp && (
        <ScheduleInterviewModal
          application={interviewModalApp}
          onClose={() => setInterviewModalApp(null)}
          onSuccess={fetchApplications}
        />
      )}
    </div>
  );
};
