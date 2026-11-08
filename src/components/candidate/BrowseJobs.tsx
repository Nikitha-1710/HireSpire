import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Job } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { JobDetailsModal } from './JobDetailsModal';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Briefcase,
  Sparkles,
  Calendar,
  Building2,
  Users,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface BrowseJobsProps {
  recommendedOnly?: boolean;
  selectedJobId?: string | null;
  onClearSelectedJobId?: () => void;
}

export const BrowseJobs: React.FC<BrowseJobsProps> = ({
  recommendedOnly = false,
  selectedJobId,
  onClearSelectedJobId,
}) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedExpFilter, setSelectedExpFilter] = useState('');

  // Selected job for modal
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedSkill) params.skill = selectedSkill;
      if (selectedLocation) params.location = selectedLocation;
      if (selectedJobType) params.job_type = selectedJobType;

      const res = await api.getJobs(params);
      let list = res.jobs;

      // Filter by experience if selected
      if (selectedExpFilter) {
        list = list.filter((j) =>
          j.experience_required.toLowerCase().includes(selectedExpFilter.toLowerCase())
        );
      }

      // Filter by recommended match (e.g. >= 65% match) if in recommended mode
      if (recommendedOnly) {
        list = list
          .filter((j) => (j.match_score ?? 0) >= 60)
          .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
      }

      setJobs(list);

      // If selectedJobId prop was passed, open that job
      if (selectedJobId) {
        const found = list.find((j) => j.job_id === selectedJobId);
        if (found) setActiveJob(found);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, selectedSkill, selectedLocation, selectedJobType, selectedExpFilter, recommendedOnly]);

  const handleAppliedSuccess = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.job_id === jobId ? { ...j, already_applied: true } : j))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {recommendedOnly ? (
              <>
                <Sparkles className="w-6 h-6 text-indigo-400" />
                Recommended Jobs For You
              </>
            ) : (
              <>
                <Briefcase className="w-6 h-6 text-indigo-400" />
                Explore & Browse Jobs
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {recommendedOnly
              ? 'Positions ranked by our transparent candidate-job matching algorithm matching your skills & credentials'
              : 'Discover career opportunities across top enterprise and high-growth technology companies'}
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3.5 backdrop-blur-sm">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job title, company name, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Skill Filter */}
          <div>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Skills</option>
              <option value="React">React</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Node.js">Node.js</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="SQL">SQL</option>
              <option value="Docker">Docker</option>
              <option value="AWS">AWS</option>
              <option value="Kubernetes">Kubernetes</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Locations</option>
              <option value="San Francisco">San Francisco, CA</option>
              <option value="New York">New York, NY</option>
              <option value="Boston">Boston, MA</option>
              <option value="Austin">Austin, TX</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <select
              value={selectedExpFilter}
              onChange={(e) => setSelectedExpFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Experience Levels</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5+">5+ years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content State: Loading, Error, Empty, List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No jobs found matching your search.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing filter constraints, or exploring different skill keywords.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSkill('');
              setSelectedLocation('');
              setSelectedJobType('');
              setSelectedExpFilter('');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const match = job.match_score ?? null;
            let skills: string[] = [];
            try {
              const p = JSON.parse(job.required_skills);
              if (Array.isArray(p)) skills = p;
              else skills = job.required_skills.split(',').map((s) => s.trim());
            } catch {
              skills = job.required_skills.split(',').map((s) => s.trim());
            }

            return (
              <div
                key={job.job_id}
                onClick={() => setActiveJob(job)}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Top Bar: Company logo, name, match score & status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {job.company_logo ? (
                        <img
                          src={job.company_logo}
                          alt={job.company_name || 'Company'}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {(job.company_name || 'H').charAt(0)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-semibold text-slate-300 block truncate max-w-[180px]">
                          {job.company_name || 'Hiring Organization'}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    {/* Transparent Match Score Pill */}
                    {match !== null && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                          match >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : match >= 60
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {match}% Match
                      </span>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {job.location}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <DollarSign className="w-3 h-3 text-slate-500" />
                      {job.salary_range}
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">{job.job_type}</span>
                    <span>·</span>
                    <span className="text-slate-400">{job.openings} openings</span>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                        +{skills.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Transparent Match Factor highlights */}
                  {job.match_reasons && job.match_reasons.length > 0 && (
                    <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/10 text-[11px] text-indigo-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{job.match_reasons.slice(0, 2).join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    Deadline: <span className="text-slate-300">{job.deadline}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.already_applied ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Applied
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View & Apply <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {activeJob && (
        <JobDetailsModal
          job={activeJob}
          onClose={() => {
            setActiveJob(null);
            if (onClearSelectedJobId) onClearSelectedJobId();
          }}
          onAppliedSuccess={handleAppliedSuccess}
        />
      )}
    </div>
  );
};
