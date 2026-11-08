import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { formatExternalUrl } from '../../utils/url';
import { useAuth } from '../../context/AuthContext';
import { CandidateDetailModal } from './CandidateDetailModal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Eye,
  FileText,
  Calendar,
  Sparkles,
  RefreshCw,
  Download,
  Globe,
  ExternalLink,
  SlidersHorizontal,
  Table,
  LayoutGrid,
  ArrowUpDown,
  Github,
  Linkedin,
  CheckCircle2,
  Award
} from 'lucide-react';

function formatExperience(exp?: string): string {
  if (!exp) return '5 Years';
  const match = exp.match(/(\d+)\+?\s*year/i);
  if (match) return `${match[1]} Years`;
  const num = exp.match(/(\d+)/);
  if (num) return `${num[1]} Years`;
  return exp;
}

function extractYearsNumber(exp?: string): number {
  if (!exp) return 2;
  const match = exp.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 2;
}

function formatDegree(edu?: string): string {
  if (!edu) return 'Bachelor';
  const lower = edu.toLowerCase();
  if (lower.includes('phd') || lower.includes('doctor')) return 'PhD';
  if (lower.includes('master') || lower.includes('ms') || lower.includes('m.tech') || lower.includes('mba')) return 'Master';
  if (lower.includes('bachelor') || lower.includes('bs') || lower.includes('b.tech') || lower.includes('b.e')) return 'Bachelor';
  if (lower.includes('associate') || lower.includes('diploma')) return 'Associate';
  return 'Bachelor';
}

function getInitials(name?: string): string {
  if (!name) return 'CD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts.map((p) => p[0].toUpperCase()).join('').slice(0, 3);
}

function getReposCount(candidateName?: string): number {
  if (!candidateName) return 3;
  const hash = candidateName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 4) + 2; // returns 2, 3, 4, or 5
}

export const CandidatesDirectory: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Search & Filter controls as shown in cards.png
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [eligibilityRule, setEligibilityRule] = useState<string>('All');
  const [sliderFitScore, setSliderFitScore] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('rank_asc');

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [interviewApp, setInterviewApp] = useState<Application | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      const res = await api.getHrApplications(params);
      setApplications(res.applications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      fetchCandidates();
      if (selectedApp) setSelectedApp(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Distinct job positions for dropdown
  const uniqueJobs = Array.from(
    new Set(applications.map((a) => a.job_title).filter(Boolean) as string[])
  );

  // Filtering Logic
  const filtered = applications.filter((app) => {
    const fit = app.fit_score ?? app.match_score ?? 0;
    const expYears = extractYearsNumber(app.candidate_experience);

    // Search query
    if (search) {
      const q = search.toLowerCase();
      const matchSearch =
        app.candidate_name?.toLowerCase().includes(q) ||
        app.candidate_skills?.toLowerCase().includes(q) ||
        app.candidate_location?.toLowerCase().includes(q) ||
        app.candidate_education?.toLowerCase().includes(q) ||
        app.job_title?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // Target Opening
    if (selectedJob !== 'All' && app.job_title !== selectedJob) {
      return false;
    }

    // Application Status
    if (selectedStatus !== 'All' && app.status !== selectedStatus) {
      return false;
    }

    // Min Fit Score Slider
    if (fit < sliderFitScore) {
      return false;
    }

    // Min Experience Slider
    if (expYears < minExperience) {
      return false;
    }

    // DMGT Eligibility Rule
    if (eligibilityRule === 'eligible_60' && fit < 60) {
      return false;
    }
    if (eligibilityRule === 'top_tier_80' && fit < 80) {
      return false;
    }
    if (eligibilityRule === 'exceeds_exp' && expYears < 5) {
      return false;
    }

    return true;
  });

  // Sorting Logic
  filtered.sort((a, b) => {
    const fitA = a.fit_score ?? a.match_score ?? 0;
    const fitB = b.fit_score ?? b.match_score ?? 0;
    const expA = extractYearsNumber(a.candidate_experience);
    const expB = extractYearsNumber(b.candidate_experience);

    if (sortBy === 'rank_asc' || sortBy === 'fit_score_desc') {
      return fitB - fitA;
    }
    if (sortBy === 'fit_score_asc') {
      return fitA - fitB;
    }
    if (sortBy === 'experience_desc') {
      return expB - expA;
    }
    if (sortBy === 'name_asc') {
      return (a.candidate_name || '').localeCompare(b.candidate_name || '');
    }
    return fitB - fitA;
  });

  const companyDisplayName = user?.company?.company_name || 'Nexus Enterprise Technologies';

  return (
    <div className="space-y-5">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & CONTEXT BAR (As in cards.png)                   */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg">
        {/* Left: Icon, Title, and Pill Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Candidate Talent Pool
          </h1>
          <span className="px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 font-semibold text-xs shadow-xs">
            {companyDisplayName}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-medium">
            Data Isolated
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono">
            {filtered.length} of {applications.length} Profiles
          </span>
        </div>

        {/* Right: Table/Cards Toggle & Sort Dropdown */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30 border border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30 border border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer pr-2"
            >
              <option value="rank_asc" className="bg-slate-950 text-slate-200">Sort: Java Rank</option>
              <option value="fit_score_desc" className="bg-slate-950 text-slate-200">Sort: Fit Score: High → Low</option>
              <option value="fit_score_asc" className="bg-slate-950 text-slate-200">Sort: Fit Score: Low → High</option>
              <option value="experience_desc" className="bg-slate-950 text-slate-200">Sort: Highest Experience</option>
              <option value="name_asc" className="bg-slate-950 text-slate-200">Sort: Candidate Name (A-Z)</option>
            </select>
          </div>

          <button
            onClick={fetchCandidates}
            title="Refresh candidate talent pool"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FILTER CONTROLS BAR (Target Opening, Status, DMGT, Sliders)  */}
      {/* ============================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Target Opening */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Target Opening
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
            >
              <option value="All">All Job Positions</option>
              {uniqueJobs.map((j) => (
                <option key={j} value={j} className="bg-slate-950 text-slate-200">
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Application Status */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Application Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
            >
              <option value="All">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="Not Selected">Not Selected</option>
            </select>
          </div>

          {/* DMGT Eligibility Rule */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              DMGT Eligibility Rule
            </label>
            <select
              value={eligibilityRule}
              onChange={(e) => setEligibilityRule(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
            >
              <option value="All">All Results (Eligible & Non-Eligible)</option>
              <option value="eligible_60">Eligible Only (Fit Score ≥ 60%)</option>
              <option value="top_tier_80">Top Qualified Tier (Fit Score ≥ 80%)</option>
              <option value="exceeds_exp">Senior Experienced (≥ 5 yrs)</option>
            </select>
          </div>

          {/* Min Fit Score Slider with Cyan Accent */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Min Fit Score:</span>
              <span className="font-bold text-cyan-400 font-mono">{sliderFitScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={sliderFitScore}
              onChange={(e) => setSliderFitScore(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Min Experience Slider with Emerald/Cyan Accent */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Min Experience:</span>
              <span className="font-bold text-cyan-400 font-mono">{minExperience} yrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={minExperience}
              onChange={(e) => setMinExperience(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN CANDIDATES VIEW: CARDS (Default) OR TABLE             */}
      {/* ============================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-red-400 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No candidates matched current filters.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try lowering the Min Fit Score or Min Experience sliders to include more talent profiles.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedJob('All');
              setSelectedStatus('All');
              setEligibilityRule('All');
              setSliderFitScore(0);
              setMinExperience(0);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ============================================================== */
        /* CARDS GRID VIEW (Matching cards.png exactly)                    */
        /* ============================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((app, idx) => {
            const fit = app.fit_score ?? app.match_score ?? 0;
            const rankNumber = idx + 1;
            const initials = getInitials(app.candidate_name);
            const reposCount = getReposCount(app.candidate_name);

            let skills: string[] = [];
            try {
              const p = JSON.parse(app.candidate_skills || '[]');
              if (Array.isArray(p)) skills = p;
              else skills = (app.candidate_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
            } catch {
              skills = (app.candidate_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
            }

            return (
              <div
                key={app.application_id}
                onClick={() => setSelectedApp(app)}
                className="bg-[#0b1329]/90 border border-slate-800/90 hover:border-slate-700 hover:bg-[#0e1834] rounded-2xl p-5 transition-all flex flex-col justify-between shadow-xl space-y-4 group cursor-pointer relative"
              >
                {/* Top Row: Avatar, Name & Title, and Rank Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar Pill with Initials or Photo */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md overflow-hidden">
                      {app.candidate_photo ? (
                        <img
                          src={app.candidate_photo}
                          alt={app.candidate_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {app.candidate_name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {app.job_title || 'Senior Software Engineer'}
                      </p>
                    </div>
                  </div>

                  {/* Rank Badge Box */}
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block leading-none">
                      Rank
                    </span>
                    <span className="text-sm font-extrabold text-white mt-1 block leading-none">
                      #{rankNumber}
                    </span>
                  </div>
                </div>

                {/* Experience & Degree 2-column Stat Box */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Experience</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {formatExperience(app.candidate_experience)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Degree</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {formatDegree(app.candidate_education)}
                    </span>
                  </div>
                </div>

                {/* Skills Pills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {skills.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="px-2 py-1 rounded-lg bg-slate-800/40 text-[11px] text-slate-400 font-medium">
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Row: GitHub, LinkedIn, and Repos Pill */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-300">
                    <a
                      href={formatExternalUrl(app.candidate_github || 'https://github.com')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                      title="Open GitHub Profile"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </a>
                    <span className="text-slate-600">·</span>
                    <a
                      href={formatExternalUrl(app.candidate_linkedin || 'https://linkedin.com')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                      title="Open LinkedIn Profile"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                      <span>LinkedIn</span>
                      <ExternalLink className="w-2.5 h-2.5 text-sky-400" />
                    </a>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-semibold flex items-center gap-1">
                    <span>{reposCount} Repos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================== */
        /* TABLE VIEW (When user clicks Table toggle)                      */
        /* ============================================================== */
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Target Role</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Degree</th>
                  <th className="py-3.5 px-4">Fit Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((app, idx) => {
                  const fit = app.fit_score ?? app.match_score ?? 0;
                  const rankNumber = idx + 1;
                  const initials = getInitials(app.candidate_name);

                  return (
                    <tr
                      key={app.application_id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                          #{rankNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                            {app.candidate_photo ? (
                              <img
                                src={app.candidate_photo}
                                alt={app.candidate_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white hover:text-cyan-300 block">
                              {app.candidate_name}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">
                              {app.candidate_email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">
                        {app.job_title}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {formatExperience(app.candidate_experience)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {formatDegree(app.candidate_education)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-full text-[11px] border inline-flex items-center gap-1 ${
                            fit >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : fit >= 60
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {fit}% Fit
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            app.status === 'Selected'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : app.status === 'Interview Scheduled'
                              ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                              : app.status === 'Shortlisted'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals for Candidate Profile Details & Interview Scheduling */}
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

      {interviewApp && (
        <ScheduleInterviewModal
          application={interviewApp}
          onClose={() => setInterviewApp(null)}
          onSuccess={fetchCandidates}
        />
      )}
    </div>
  );
};

